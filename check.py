#!/usr/bin/env python3
"""Focused, dependency-free material contrast, CSS cascade and HTTP guardrails."""
import argparse
import json
from pathlib import Path
import re
import time
import unittest
import urllib.error
import urllib.request

ROOT = Path(__file__).resolve().parent


def luminance(colour):
    rgb = [int(colour[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    linear = [v / 12.92 if v <= .04045 else ((v + .055) / 1.055) ** 2.4 for v in rgb]
    return sum(v * weight for v, weight in zip(linear, (.2126, .7152, .0722)))


def contrast(first, second):
    low, high = sorted((luminance(first), luminance(second)))
    return (high + .05) / (low + .05)


def assert_icon_cascade(css):
    # A later generic icon rule once reset the shared .glass background to transparent.
    for selector, declarations in re.findall(r'([^{}]+)\{([^{}]*)\}', css):
        if '.icon-button' in (s.strip() for s in selector.split(',')):
            assert not re.search(r'(?:^|;)\s*background(?:-image|-color)?\s*:', declarations), 'Generic .icon-button must not reset .glass background'


class MaterialChecks(unittest.TestCase):
    def test_normal_text_tokens_have_aa_contrast(self):
        tokens = json.loads((ROOT / 'tokens.json').read_text())
        for name, values in tokens['colour'].items():
            pairs = [('pigment', 'onMaterial')] if 'pigment' in values else [('canvas', 'text'), ('canvas', 'secondaryText')]
            for background, foreground in pairs:
                with self.subTest(colour=name, foreground=foreground):
                    self.assertGreaterEqual(contrast(values[background], values[foreground]), 4.5)

    def test_contrast_math_rejects_pale_labels(self):
        self.assertAlmostEqual(contrast('#000000', '#ffffff'), 21)
        self.assertLess(contrast('#e8a89f', '#793d37'), 4.5)

    def test_icon_material_cascade(self):
        assert_icon_cascade((ROOT / 'sea-glass.css').read_text())

    def test_icon_guard_rejects_regression(self):
        for declaration in ['background:transparent', 'background-color:transparent', 'background-image:none']:
            with self.subTest(declaration=declaration), self.assertRaises(AssertionError):
                assert_icon_cascade('.glass{background:red}.icon-button{' + declaration + '}')

    def test_material_icon_keeps_a_name_on_mobile(self):
        html = (ROOT / 'index.html').read_text()
        button = re.search(r'<button[^>]*id="tune-toggle"[^>]*>', html).group()
        self.assertIn('aria-label="Material"', button)

    def test_navigation_bindings_use_collection_helper(self):
        source = (ROOT / 'studio.js').read_text()
        self.assertNotRegex(source, r"(?<!\$)\$\([^()\n]*\)\.forEach")
        self.assertIn("$('button[data-view]').forEach", source)

    def test_svg_and_token_assets_are_valid(self):
        import xml.etree.ElementTree as ET
        ET.parse(ROOT / 'grain.svg')
        tokens = json.loads((ROOT / 'tokens.json').read_text())
        self.assertGreaterEqual(tokens['target']['minimum'], 44)
        self.assertLess((ROOT / 'grain.svg').stat().st_size, 40000)


def check_http(url):
    base = url.rstrip('/')
    for route, marker in [('/', 'content="sea-glass"'), ('/studio.js', 'specimens'), ('/motion.js', 'SeaMotion'), ('/fileloom.css', '.fl-app'), ('/fileloom-model.js', 'FileloomDemo'), ('/fileloom.js', 'flRender'), ('/sea-glass.css', '.glass'), ('/tokens.json', 'Sea Glass'), ('/grain.svg', '<svg'), ('/README.md', 'Sea Glass')]:
        with urllib.request.urlopen(base + route, timeout=3) as response:
            assert response.status == 200
            assert marker in response.read().decode()
            assert response.headers['Cache-Control'] == 'no-store'
            assert response.headers['X-Content-Type-Options'] == 'nosniff'
    for route in ['/serve.py', '/start-preview.sh', '/check.py', '/../../AGENTS.md', '/%2e%2e/AGENTS.md', '/.git/config', '/missing.html', '/fileloom-checks.mjs', '/fileloom-browser-checks.mjs']:
        try:
            urllib.request.urlopen(base + route, timeout=3)
        except urllib.error.HTTPError as error:
            assert error.code == 404, (route, error.code)
        else:
            raise AssertionError(f'Unexpectedly served private or unknown route: {route}')
    print('HTTP: 10 public assets passed; 9 private/unknown routes rejected.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--url')
    args = parser.parse_args()
    started = time.monotonic()
    result = unittest.TextTestRunner(verbosity=2).run(unittest.defaultTestLoader.loadTestsFromTestCase(MaterialChecks))
    if not result.wasSuccessful():
        raise SystemExit(1)
    if args.url:
        check_http(args.url)
    print(f'Elapsed: {time.monotonic() - started:.2f}s. Focused preview checks only.')
