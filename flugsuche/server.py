#!/usr/bin/env python3
"""Lokaler Server für die Flugsuche.

Er liefert die Webseite aus und leitet Suchanfragen an SerpApi (Google Flights)
weiter. Der API-Schlüssel bleibt dabei auf deinem Rechner und landet nie im Browser.

Start:  python3 server.py
Dann im Browser öffnen: http://localhost:8000
"""

import json
import os
import time
import urllib.error
import urllib.parse
import urllib.request
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent
PORT = int(os.environ.get("PORT", "8000"))
SERPAPI_URL = "https://serpapi.com/search.json"
CACHE_SECONDS = 30 * 60  # gleiche Suche 30 Minuten lang nicht erneut abrufen (spart Kontingent)

# Nur diese Parameter dürfen vom Browser an SerpApi durchgereicht werden.
ALLOWED_PARAMS = {
    "departure_id", "arrival_id", "outbound_date", "return_date", "type",
    "travel_class", "adults", "children", "infants_in_seat", "infants_on_lap",
    "currency", "hl", "gl", "stops", "sort_by", "departure_token", "deep_search",
}

_cache = {}


def load_env_file():
    """Liest Einträge wie SERPAPI_KEY=... aus der Datei .env neben diesem Skript."""
    env_path = ROOT / ".env"
    if not env_path.exists():
        return
    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def api_key():
    key = os.environ.get("SERPAPI_KEY", "").strip()
    return "" if key.startswith("dein-") else key


class Handler(SimpleHTTPRequestHandler):
    extensions_map = {**SimpleHTTPRequestHandler.extensions_map, ".js": "text/javascript"}

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self):
        # Während der Entwicklung immer die neueste Version der Dateien laden
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == "/api/status":
            return self.send_json(200, {"live": bool(api_key())})
        if parsed.path == "/api/flights":
            return self.proxy_flights(parsed.query)
        # Geheime oder interne Dateien nie ausliefern
        name = Path(urllib.parse.unquote(parsed.path)).name
        if name.startswith(".") or name.endswith(".py"):
            return self.send_error(404)
        return super().do_GET()

    def proxy_flights(self, query_string):
        key = api_key()
        if not key:
            return self.send_json(503, {"error": "Kein SerpApi-Schlüssel hinterlegt (Datei .env)."})

        params = {k: v for k, v in urllib.parse.parse_qsl(query_string) if k in ALLOWED_PARAMS}
        params.setdefault("currency", "EUR")
        params.setdefault("hl", "de")
        params.setdefault("gl", "de")
        cache_key = urllib.parse.urlencode(sorted(params.items()))

        cached = _cache.get(cache_key)
        if cached and time.time() - cached[0] < CACHE_SECONDS:
            return self.send_json(200, cached[1])

        url = SERPAPI_URL + "?" + urllib.parse.urlencode({**params, "engine": "google_flights", "api_key": key})
        try:
            with urllib.request.urlopen(url, timeout=60) as response:
                data = json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as err:
            try:
                data = json.loads(err.read().decode("utf-8"))
            except ValueError:
                data = {"error": f"SerpApi antwortete mit Fehler {err.code}."}
            return self.send_json(err.code, data)
        except (urllib.error.URLError, TimeoutError) as err:
            return self.send_json(502, {"error": f"SerpApi nicht erreichbar: {err}"})

        if not data.get("error"):
            _cache[cache_key] = (time.time(), data)
        return self.send_json(200, data)

    def send_json(self, status, payload):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def main():
    load_env_file()
    server = ThreadingHTTPServer(("127.0.0.1", PORT), Handler)
    mode = "Live-Preise über SerpApi" if api_key() else "Beispieldaten (kein SerpApi-Schlüssel in .env)"
    print(f"Flugsuche läuft auf http://localhost:{PORT}  –  {mode}")
    print("Beenden mit Strg+C")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServer beendet.")


if __name__ == "__main__":
    main()
