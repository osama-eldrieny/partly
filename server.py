"""PartlyRepair-style concept demo.

Serves the page and asks Claude to build a parts estimate as structured data.
The page only draws fixed components from that data. The API key stays here, never in the page.
Run with: .venv/bin/python server.py
"""
import json
import os
import re
import time
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

import anthropic

ROOT = os.path.dirname(os.path.abspath(__file__))
REPLAYS = os.path.join(ROOT, "replays")
PORT = 8791
MODEL = "claude-sonnet-5-5"
TIMEOUT_S = 25


def load_env():
    path = os.path.join(ROOT, ".env")
    if not os.path.exists(path):
        return
    for line in open(path):
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            if v.strip():
                os.environ.setdefault(k.strip(), v.strip())


load_env()
CATALOG = json.load(open(os.path.join(ROOT, "catalog.json")))
PART_IDS = {p["id"] for v in CATALOG["vehicles"] for p in v["parts"]}

SYSTEM = """You are the estimating brain inside a repair-shop parts assistant. The vehicle and its trim are already confirmed (from the number plate or picked by the user) and given to you. A busy estimator then describes the damage in a few words, often between phone calls. You turn that into a parts list for THAT vehicle and trim only.

You never draw the screen yourself. You return data, and the app renders it with a fixed set of components:
- part_card: one part on the estimate.
- question_card: a short question with 2-3 one-tap choices, used when you can't tell which part is right.
- note: a short practical tip for the repairer (for example, "Check the parking sensors behind the bumper"). Never use it for a missing part.
- not_found: the damage needs a part that is not in the catalogue for this vehicle and trim. part_id is null. reason_short says what is missing in plain words, like "No right LED headlight found for this Corolla." The app then offers the user ways forward.
  Out of stock is NOT not_found: if the right part exists but has no stock, use part_card (the app shows an "Out of stock" chip). Don't add a note about stock either.

How to decide the mode of each line (the cost of being wrong is the lens):
- auto: you are sure (confidence >= 0.9) and the part is cheap (under $150) and returnable. It is added for the user, who can undo.
- suggest: you are fairly sure (0.6-0.9), or the part is expensive or non-returnable. The user confirms with one tap.
- ask: two or more catalogue parts still fit after applying the confirmed trim (for example new vs used). Use a question_card. Don't guess an expensive part. Never ask about the vehicle or trim: they are known.

Questions:
- Ask about the root cause, once. If one fact (like the trim) decides several parts, ask ONE question about that fact. Each choice lists every part id that answer selects (e.g. choice "Ascent Sport" -> bumper without sensor holes AND halogen headlight).
- Never ask two questions that one answer would settle.
- Each choice label names the option in plain words (max 5 words), no prices.

Order and dependencies:
- List main parts first (the damaged panels and lights), then supporting parts (absorbers, clips, bolts).
- If a main part is still a question, supporting parts that depend on it must be "suggest", never "auto".
- Only use parts whose "fits" matches the confirmed trim or says "All trims".

Rules:
- Only use part ids from the catalogue below. Never invent parts, numbers, prices or suppliers.
- Include the small parts a real repair needs (clips, absorbers) when the damage implies them.
- Parts that every repair of this kind needs are certain, not guesses: a clip and fastener kit whenever a bumper cover comes off, for example. Give them confidence 0.95 so the app can add them for the user (they are cheap and returnable).
- reason_short: one plain sentence, max 12 words, written for a mechanic. reason_long: max 2 sentences with the evidence.
- question: max 10 words. Choice labels: max 5 words, no prices (the app shows prices).
- If the vehicle isn't in the catalogue, return no lines and say so in reply.
- reply: one short friendly sentence, no jargon. Say "added" only for auto lines; say "suggested" for suggest lines. It must match what the screen shows.
- steps: 3-4 short progress steps describing what you checked, like "Matched vehicle: 2019 Corolla".

When the request includes the current estimate and a user correction or answer, return the full updated list:
- Apply the correction literally. If the user says "right, not left", remove the left part and add the right one.
- Keep every other line unchanged, including lines the user already chose or approved.
- Never invent a part to satisfy a correction. If it doesn't exist for this vehicle, use not_found.

Writing for mechanics: never say "catalogue", "database", "trim code" or "ID". Name the car the way a mechanic would ("this Corolla").
Parts with "role": "fitting" are supporting parts; "main" parts are the damaged panels, lights, glass. Services (calibration) are fitting items: suggest them whenever glass or sensors are replaced on a vehicle that has them.

CATALOGUE:
""" + json.dumps(CATALOG, separators=(",", ":"))

NULLABLE_STR = {"type": ["string", "null"]}
SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "required": ["vehicle", "steps", "lines", "reply"],
    "properties": {
        "vehicle": {
            "type": ["object", "null"],
            "additionalProperties": False,
            "required": ["id", "name", "trim_known"],
            "properties": {"id": {"type": "string"}, "name": {"type": "string"}, "trim_known": {"type": "boolean"}},
        },
        "steps": {"type": "array", "items": {"type": "string"}},
        "lines": {
            "type": "array",
            "items": {
                "type": "object",
                "additionalProperties": False,
                "required": ["component", "part_id", "confidence", "mode", "reason_short", "reason_long", "question", "choices"],
                "properties": {
                    "component": {"type": "string", "enum": ["part_card", "question_card", "note", "not_found"]},
                    "part_id": NULLABLE_STR,
                    "confidence": {"type": "number"},
                    "mode": {"type": "string", "enum": ["auto", "suggest", "ask"]},
                    "reason_short": {"type": "string"},
                    "reason_long": {"type": "string"},
                    "question": NULLABLE_STR,
                    "choices": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "additionalProperties": False,
                            "required": ["label", "part_ids"],
                            "properties": {"label": {"type": "string"}, "part_ids": {"type": "array", "items": {"type": "string"}}},
                        },
                    },
                },
            },
        },
        "reply": {"type": "string"},
    },
}


def clean(result):
    """Drop anything that points at a part that isn't in the catalogue."""
    lines = []
    for line in result.get("lines", []):
        if line["component"] == "part_card" and line.get("part_id") not in PART_IDS:
            continue
        for c in line.get("choices", []):
            c["part_ids"] = [pid for pid in c["part_ids"] if pid in PART_IDS]
        line["choices"] = [c for c in line.get("choices", []) if c["part_ids"]]
        if line["component"] == "question_card" and len(line["choices"]) < 2:
            continue
        lines.append(line)
    result["lines"] = lines
    return result


def estimate(body):
    client = anthropic.Anthropic(timeout=TIMEOUT_S, max_retries=0)
    text = body.get("message", "").strip()[:600]
    v = body.get("vehicle") or {}
    vehicle = next((x for x in CATALOG["vehicles"] if x["id"] == v.get("id")), None)
    if vehicle:
        text = f"Confirmed vehicle: {vehicle['name']} (id {vehicle['id']}), trim: {v.get('trim')}\nDamage: " + text
    if body.get("current"):
        text = "Current estimate:\n" + json.dumps(body["current"]) + "\n\nUser: " + text
    response = client.beta.messages.create(
        model=MODEL,
        max_tokens=8000,
        betas=["server-side-fallback-2026-07-01"],
        fallbacks="default",
        output_config={"effort": "low", "format": {"type": "json_schema", "schema": SCHEMA}},
        system=[{"type": "text", "text": SYSTEM, "cache_control": {"type": "ephemeral"}}],
        messages=[{"role": "user", "content": text}],
    )
    if response.stop_reason == "refusal":
        raise RuntimeError("The model declined this request.")
    raw = next(b.text for b in response.content if b.type == "text")
    return clean(json.loads(raw))


def save_replay(vehicle, message, result):
    os.makedirs(REPLAYS, exist_ok=True)
    key = (vehicle or {}).get("id", "") + " " + message
    slug = re.sub(r"[^a-z0-9]+", "-", key.lower()).strip("-")[:60] or "estimate"
    path = os.path.join(REPLAYS, slug + ".json")
    if os.path.exists(path):  # keep the curated recording; only record new jobs
        return
    with open(path, "w") as f:
        json.dump({"vehicle": vehicle, "message": message, "result": result}, f, indent=2)


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def end_headers(self):
        # Always serve the latest files, so a live demo never shows a stale stylesheet.
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def _json(self, code, data):
        body = json.dumps(data).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path.startswith("/.env") or self.path.startswith("/.venv"):
            return self._json(404, {"error": "not found"})
        if self.path == "/api/replays":
            items = []
            if os.path.isdir(REPLAYS):
                for name in sorted(os.listdir(REPLAYS)):
                    if name.endswith(".json"):
                        items.append(json.load(open(os.path.join(REPLAYS, name))))
            return self._json(200, items)
        if self.path == "/api/contract":
            # The exact instructions and output schema the model gets, minus the catalogue data.
            return self._json(200, {"model": MODEL, "instructions": SYSTEM.split("CATALOGUE:")[0].strip(), "schema": SCHEMA})
        if self.path == "/api/status":
            return self._json(200, {"model": MODEL, "key": bool(os.environ.get("ANTHROPIC_API_KEY"))})
        return super().do_GET()

    def do_POST(self):
        if self.path != "/api/estimate":
            return self._json(404, {"error": "not found"})
        body = json.loads(self.rfile.read(int(self.headers.get("Content-Length", 0))) or b"{}")
        started = time.time()
        try:
            result = estimate(body)
        except anthropic.AuthenticationError:
            return self._json(401, {"error": "API key missing or invalid. Add it to .env"})
        except anthropic.APITimeoutError:
            return self._json(504, {"error": "The AI took too long"})
        except anthropic.APIStatusError as e:
            return self._json(502, {"error": f"API error {e.status_code}: {e.message}"})
        except anthropic.APIConnectionError:
            return self._json(503, {"error": "No connection to the AI"})
        except (RuntimeError, ValueError, StopIteration) as e:
            return self._json(502, {"error": str(e) or "Unexpected answer"})
        result["ms"] = int((time.time() - started) * 1000)
        if not body.get("current"):
            save_replay(body.get("vehicle"), body.get("message", ""), result)
        return self._json(200, result)



if __name__ == "__main__":
    print(f"Demo running at http://localhost:{PORT}  (model: {MODEL})")
    ThreadingHTTPServer(("127.0.0.1", PORT), Handler).serve_forever()
