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
| `replays/` | Recorded real answers, for the offline version |
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
