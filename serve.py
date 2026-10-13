#!/usr/bin/env python3
"""Serve only the Sea Glass preview's public assets on a supplied private IP."""
import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parent
PUBLIC = {'index.html', 'sea-glass.css', 'studio.js', 'motion.js', 'fileloom.css', 'fileloom-model.js', 'fileloom.js', 'grain.svg', 'tokens.json', 'README.md'}


class PreviewHandler(SimpleHTTPRequestHandler):
    def send_head(self):
        path = urlsplit(self.path).path
        filename = 'index.html' if path == '/' else path.removeprefix('/')
        if filename not in PUBLIC or (ROOT / filename).is_symlink():
            self.send_error(404)
            return None
        return super().send_head()

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'")
        super().end_headers()


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--bind', required=True)
    parser.add_argument('--port', type=int, default=8786)
    args = parser.parse_args()
    server = ThreadingHTTPServer((args.bind, args.port), partial(PreviewHandler, directory=str(ROOT)))
    print(f'Sea Glass preview: http://{args.bind}:{args.port}/', flush=True)
    server.serve_forever()
