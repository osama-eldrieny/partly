# Repair AI: a design system and demo concept

An unofficial concept by Osama Eldrieny. Not a Partly product. Part numbers, suppliers and prices are made up.

A repair-quote assistant where the AI picks parts and the design system draws the screen.
The AI sends data, never a screen. The screen checks the rules again, such as the price limit.

## What is here

| File | What it is |
|---|---|
| `index.html` | The demo: plate, damage, "Needs you", the quote, send, repair guide |
| `system.html` | The design system documentation: tokens, components, Do and Don't |
| `presentation.html` | The presentation, with the live demo and the design-system rules behind it |
| `tokens.css` | Two tiers of tokens: primitive and semantic |
| `components.css`, `components.js` | The components |
| `RULES.md` | The written rules for designers, engineers and the AI |
| `catalog.json`, `repair-steps.js` | Parts, prices and repair steps |
| `replays/`, `replays.json` | Recorded real answers for the offline version. `replays.json` is the same data in one file, for static hosting such as GitHub Pages |
| `contract.json` | A snapshot of the AI instructions and schema, shown in `system.html` when no server is running |
| `server.py` | Small local server that serves the files and calls the Claude API |

## Run it

```bash
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
cp .env.example .env        # then add your own ANTHROPIC_API_KEY
.venv/bin/python server.py
```

Open http://localhost:8791/index.html (demo), `system.html` (docs) and `presentation.html` (slides).

No API key? Open `http://localhost:8791/index.html?replay=1` for the offline version with recorded answers.

## GitHub Pages

The pages work on static hosting. Without `server.py` there is no live AI, so the demo runs in offline mode with the recorded answers (`replays.json`).
To refresh `replays.json` after recording new answers locally:

```bash
python3 -c "import json,os;print(json.dumps([json.load(open('replays/'+n)) for n in sorted(os.listdir('replays')) if n.endswith('.json')],separators=(',',':')))" > replays.json
```
