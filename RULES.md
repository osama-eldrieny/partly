# Parts Assistant: design system rules

Written for two readers: an engineer and a coding agent. If a rule is unclear to either, the rule is wrong.

## 1. Tokens
- Two tiers: primitives (`--p-*`, raw values) and semantic (`--s-*`, meaning).
- Components take colours from **semantic tokens only**. Never a colour primitive or a raw hex value.
- Space, radius, type and motion have no theme, so components use primitives for them directly.
- Semantic tokens (`--s-*`) carry meaning, not colour. `--s-certain`, `--s-likely` and `--s-unsure` describe how sure the AI is. Don't use them for anything else.
- New theme or brand = new token values. Components never change.

## 2. What the AI can return (4 shapes)
The AI never draws UI. It returns data in one of these 4 shapes (enforced by the output schema). The app turns each shape into a UI component and fills in price, stock, returns and supplier from the catalogue.

| Shape | Becomes (UI component) | Use when | Never |
|---|---|---|---|
| `part_card` | Part card (suggest) or Quote row (auto) | One part belongs on the quote | Invent a part, number, price or supplier |
| `question_card` | Question card | Two or more parts could fit and the job doesn't say which | Ask more than one question per card, or offer more than 3 choices |
| `note` | Tip | A practical tip for the repairer, shown as "Tip" | Use it for a missing part, or repeat what a card already says |
| `not_found` | Not found card | The damage needs a part that doesn't exist for this vehicle | Use it for out-of-stock parts (that's a `part_card` with an "Out of stock" chip) |

## 3. Modes: who decides
The cost of being wrong decides, not the confidence alone.

| Mode | Rule | User action |
|---|---|---|
| `auto` | Confidence ≥ 0.9 **and** price < $150 **and** returnable | Can undo |
| `suggest` | Anything else the AI is fairly sure about | One tap to add |
| `ask` | The AI can't tell between options | One tap to choose |

**The UI enforces this rule, not the prompt.** If the model returns `auto` for an expensive or non-returnable part, the component renders it as `suggest`. The user sees a normal suggestion; no message about the AI. The chips ("Not returnable") and the price already say why it needs their OK.

## 4. Showing the AI's thinking
- One short reason (max 12 words) is always visible.
- The longer reason sits behind "Why?". It's never shown by default.
- Confidence is shown as "82% sure", next to the mode, never as a bare number.
- The bar has 3 bands: **90%+ black** (sure, the auto limit), **70–89% grey** (fairly sure), **below 70% red** (check before adding). No other colours.

## 5. Corrections
- Every AI decision has a one-tap way out: **Undo**, **Remove** or **Wrong part**.
- "Wrong part" shows only parts that fit the same slot on the same vehicle **and trim** (or parts marked "All trims"). If none fit, say so and point to the text box.
- A user's choice is labelled **Chosen by you**, and the AI must not change it in later updates.

## 6. Copy
- Write for a mechanic between phone calls: short, plain, no AI jargon.
- Say what happened ("Added 4 parts, 1 needs you"), not what the AI "thinks".

## 7. Screen layout
- **Needs you** (top): full cards, only for decisions (suggestions and questions). Order: questions, then main parts, then fitting parts.
- **On the quote** (below): one compact row per part, like an invoice. Shows who added it (Auto, You, Approved), the price and Undo. Tap to expand details.
- When nothing needs the user, show "All done" and the next action (Send quote).

## 8. Chips: highlight by risk, not by decoration
- **Red chip = a risk for the user:** Not returnable, Used part, or stock under 3 (including "0 in stock").
- **Same place every card:** delivery and stock always sit in the header row; only the colour changes. Risks always sit in the row below. Always with an icon and text, never colour alone.
- **Grey = normal facts:** delivery time, stock count. On the Part card they sit as quiet text on the right of the supplier row, not as chips, so the chips row only appears when there is a risk.
- **Stock is one format:** "N in stock" (e.g. "3 in stock"). Red under 3, grey from 3 up. No cap on red chips per card: every real risk shows red.

## 9. Icons
- Lucide only, one stroke width, 13–16px. An icon always sits next to text, except where the same text is in an `aria-label`.

## 10. Saying "no" safely
- The AI never invents a part to satisfy a request. It returns `not_found`.
- A `not_found` card is never a dead end. It always offers: **Ask suppliers for a price**, **Add part manually**, **Not needed**.
- A pending supplier request sits on the quote as "Price pending" and doesn't block sending.

## 11. Corrections keep the user's work
- After a correction, the AI returns a full new list. The app keeps every decision the user already made (approved, chosen, removed, manual parts, pending requests).

## 12. Source labels: who put this part on the quote
- Every row on the quote answers **"How did this part get here?"** Label = who, then what they did.

| Situation | Label | Icon |
|---|---|---|
| AI added it on its own (auto mode) | **Added by AI** | sparkles |
| AI suggested it, the user tapped Add | **You approved** | check |
| User picked it from a question or "Wrong part" | **You chose** | pointer |
| User typed it in | **You added** | pencil |
| Waiting for supplier replies | **Waiting for price** (price column: "Price pending") | clock |

- **Only "Added by AI" stands out** (outlined). These are the parts the user never looked at. "You…" labels stay quiet grey.
- The quote header counts them: "3 added by AI: check before sending".
- Every label has a one-line tooltip that explains it in plain words.
- Never use "Auto" (jargon), a bare "You" (you did what?), or confidence on the quote ("AI 95%"): confidence belongs on suggestions.
- A status ("Waiting for price") is not a source. Never mix the two in one label.

## 13. After sending: the job keeps going
- **Sending is visible.** Show the steps as they happen: checking the quote, holding parts with each supplier, asking suppliers for pending prices, sending to the customer. Never a silent spinner.
- **The receipt is for the user, not about the AI.** It shows car and plate, parts grouped by supplier with ETA, risk chips ("Not returnable"), the total and the job progress. Never AI stats, confidence, source labels, the $150 rule or build time.
- **The job tracker has 6 steps:** Quote built, Sent to the customer, Customer approves, Parts ordered, Parts arrive, Repair and close the job. Each step is **done**, **now** (one at a time) or **next**.
- **Next-step chips sit above the input** and change with the stage. The input stays open: anything typed after sending reopens the quote as a change.
- **Demo honesty:** the receipt says "Demo: nothing was sent to a customer or supplier."

## 14. Repair guide
- Steps come from **the parts on the quote and the trim**, never a fixed list. Used parts add a check step. Sensors, cameras and blind-spot systems add a calibration or test step.
- One step open at a time: what to do, the time, one red warning line if there is a risk, then **Done** / **Back**.
- **The final inspection needs a photo** before "Inspection passed". Then the job can close.
- Always show: "Illustrative steps for the demo. A real job follows the OEM repair procedure."
- **Step images:** one per step, generic car of the same body type, the part in red, everything else grey line art. Left and right are **the car's own sides** (as seen from the driver's seat): check every left/right image before use. Show the image full width with no frame, darkened 5% so its white background doesn't disappear into the card.

## 15. Small inputs
- **Plate input:** NZ strip and border share one colour; only the text field is white, so no light shows at the rounded corners. Same height as the button next to it (48px).
- **Question choices:** equal width and height in a grid, stacking on narrow screens. One choice must never look more important because its text is longer.
