#!/usr/bin/env bash
set -euo pipefail
preview_root="$(cd "$(dirname "$0")" && pwd)"
preview_ip="$(tailscale ip -4 | head -n 1)"
preview_port="${SEA_GLASS_PREVIEW_PORT:-8786}"
preview_label="io.sea-glass.preview"
preview_python="$(command -v python3)"
if [[ -z "$preview_ip" ]]; then
  echo 'Tailscale IPv4 is unavailable. Start Tailscale before running the preview.' >&2
  exit 1
fi
if ! launchctl print "gui/$(id -u)/$preview_label" >/dev/null 2>&1; then
  # A session job keeps the server alive after the Codex turn, without a login agent.
  launchctl submit -l "$preview_label" \
    -o /tmp/sea-glass-preview.log -e /tmp/sea-glass-preview.log -- \
    "$preview_python" "$preview_root/serve.py" --bind "$preview_ip" --port "$preview_port"
fi
"$preview_python" - "$preview_ip" "$preview_port" <<'PY'
import sys, time, urllib.request
url = f'http://{sys.argv[1]}:{sys.argv[2]}/'
deadline = time.monotonic() + 12
while True:
    try:
        with urllib.request.urlopen(url, timeout=2) as response:
            body = response.read().decode()
            assert response.status == 200
            assert 'name="fileloom-preview" content="sea-glass"' in body
        print('Verified tailnet preview: ' + url)
        break
    except Exception:
        if time.monotonic() >= deadline:
            raise
        time.sleep(.2)
PY
