# Make a Remix

A practical walk-through of the TAROKE REMIXER chambers in order. Each section matches a named step in the left-side navigation rail.

---

## SOURCE — lineage and identity

The Source chamber records what the remix inherits and how the exported work identifies itself.

Fields:

- **Title** — the project's working title. Updates the topbar, identity slip, surface preview, run stage head, and export filename immediately as you type.
- **Author** — your name as the remix author.
- **Source title** — the work being remixed (e.g. "Taroko Gorge").
- **Source URL** — an optional reference link to the source.
- **Statement** — a brief statement of intent or context. Appears on the exported artifact's cover.
- **Credits** — acknowledgement text.

Identity synchronization is immediate: any change to Title, Author, or Source title reflects in all live mirrors within the same chamber entry — you do not need to navigate away and back to see the update.

---

## SAMPLES — word banks

Sample banks are the raw material the poem draws from. Each bank holds a set of tokens.

**Bank selector (left)**

Banks are listed as tabs. Each tab shows:
- The bank's label (a human-readable name).
- The token count, default role, and description.

The bank's **ID** (a short lowercase key such as `above` or `labor_verbs`) is the internal reference used by devices and triggers. The **label** is display text only and can be edited freely.

**Bank editor (right)**

- **Bank label** — displayed name.
- **Default role** — semantic role for the bank's tokens (`noun`, `verb`, `adjective`, `adverb`, `preposition`, `literal`, `mixed`). Affects default form inflection.
- **Description** — a plain-text note on the bank's purpose.

**Adding banks**: click **Add bank**. A new bank appears with a generated ID.

**Duplicating a bank**: select the bank and use the appropriate action. Increasing a token's weight effectively duplicates its chance of selection.

**Moving tokens between banks**: drag a token cell to a different bank tab.

**Bulk paste**: paste comma-separated, line-separated, or double-space-separated words into the bulk textarea and click **Add pasted samples**.

**Deleting banks**: click **Delete bank**. Deletion is blocked if the bank is referenced by any device input or trigger. Reroute references first. The last remaining bank cannot be deleted.

**Tokens**

Each token has:
- **Literal** — the source word or phrase.
- **Role** — overrides the bank's default role for this token.
- **Weight** — relative selection weight. Higher = more frequent. A weight of 2 is roughly twice as likely as 1.
- **Locked literal** — when checked, inflection forms (plural, third-singular, etc.) return the literal as-is.

---

## FORMS — inflection rules

The Forms chamber controls how tokens are inflected when a route template requests a specific form.

**Global defaults**

- **Case policy** — `preserve` (keep literal casing), `upper`, `lower`, or `title`.
- **Compound handling** — for multi-word or hyphenated tokens: `head` (pluralize head word) or `literal` (keep literal).

**Tray policy**

Banks with a `noun` role apply noun forms; banks with a `verb` role apply verb forms. Mixed-role banks require per-token role assignment.

**Sample override (per-token)**

Select a token to set explicit overrides:
- **Plural override** — a fixed plural form that bypasses automatic inflection.
- **Verb 3sg override** — a fixed third-singular form (e.g. "is" for "be").
- **Lock literal** — prevents all inflection forms from changing the literal.

---

## DEVICES — line templates

Line devices are the machines that produce individual lines. Each device has:

- **Name** — used in the event tape and line recipe.
- **Description** — internal documentation.
- **Input slots** — each slot names a bank to draw from. Slot name, bank ID, and default role.
- **Routes** — weighted route templates. The device picks a route each time it fires.

**Route templates**

A route template is a text field. Write static text and insert slot variables using the **slot chips** — one chip per defined input slot, each labeled with the slot name and available forms.

Clicking a chip inserts the complete variable at the cursor position in the active route textarea. Example:

```
{above:plural} {trans:base} the {below:literal}.
```

Variables follow the pattern `{slotName:form}`. Supported forms include `literal`, `base`, `plural`, `singular`, `thirdSingular`, `uppercase`, `lowercase`, `title`. The special form `{article:a}` inserts "a" or "an" based on the first noun slot.

**Route name** and **route weight**: higher weight routes are chosen more often. A route at weight 80 is chosen four times as often as a route at weight 20.

You can also type `{slotName:form}` directly into the template textarea without using chips.

---

## STANZA — device arrangements

A stanza pattern arranges device slots into a repeatable form.

- **Pattern name** and **description**.
- **Slots**: add a device slot (one per defined device) or a breath. Slots fire in order.
- **Slot settings**: each slot has:
  - **Chance** — 0–100 probability this slot fires on each pass.
  - **Repeat** (optional): `loop` mode fires the slot multiple times up to a maximum.

Slots can be reordered. Breaths produce blank intervals between lines.

---

## FLOW — scene routing

Flow scenes select which stanza pattern gets the next chance to run.

Each scene has:
- **Name**.
- **Stanza reference** — which stanza pattern this scene activates.
- **Chance/weight** — relative selection weight.
- **Enabled/Off** toggle — disabled scenes are never chosen.

Scenes can be reordered and deleted. At least one enabled scene referencing a usable stanza is required for generation.

---

## TRIGGERS — conditional line modifications

Triggers intercept a line after generation and can append, prepend, or replace text when a specific consumed sample appears.

Each trigger has:
- **Configured bank** — the bank to watch.
- **Source term** — a specific token literal to match, or blank to match any token from the bank.
- **Chance** — 0–100 probability the trigger fires when the condition is met.
- **Action** — `append`, `prepend`, or `replace`.
- **Action text** — the text to append, prepend, or substitute.

**Important:** triggers only respond to samples that were **consumed by the chosen route template**. If a device input slot exists but its variable `{slot:form}` does not appear in the route template that was selected for that line, samples from that slot are not eligible for trigger matching — even if they were drawn. This keeps trigger semantics aligned with what the surface actually shows.

A trigger's source term can match the original token literal even when the surface shows a transformed form (e.g., the plural). The match is against the source literal, not the rendered form.

---

## SURFACE — run and export settings

The Surface chamber configures how the poem appears at runtime and in the exported artifact.

Controls:
- **Speed ms** — milliseconds between generated lines.
- **Line retention** — how many lines stay visible on the surface at once.
- **Poem size** — font size in pixels.
- **Line height** — spacing multiplier.
- **Trace mode** — `hidden` (no tape), `receipt`, or `event tape` (shows the event trace line below the surface).

No visible line numbers appear in the run surface or exported artifact.

---

## RUN — live generation

The Run chamber starts, pauses, and resets the poem. Controls:

- **Run** — starts generation.
- **Pause** — stops without clearing events.
- **Reset** — clears all generated events.

**Event tape**: when trace mode is not `hidden`, a trace line appears below the surface showing the last device / route / tick.

**Line recipe**: click any generated line to open its recipe. The recipe shows:
- The rendered surface text.
- Trace metadata (device, route, tick).
- **Consumed samples** — the tokens that were drawn and used by the route template.
- **Selected but not rendered** — tokens drawn for slots that were not referenced by the chosen route template.

Run stage scrolling follows new output automatically when you are near the bottom. Scrolling up suspends auto-follow; scrolling back to the bottom resumes it.

**Notes (from Run)**: from a line recipe, click **Keep as sample line** or **Mark for repair** to add it to Notes.

---

## NOTES — line evidence

The Notes chamber lists lines you have kept or flagged. Each note shows:
- Status (`keep` or `repair`).
- The surface text.
- The event trace.
- **Open recipe** — reopens the line's recipe in a modal dialog.

---

## EXPORT — saving and distribution

The Export chamber is the final delivery point. Primary actions appear first:

- **Save playable HTML** — downloads a standalone `.taroke.html` file that runs the poem without the editor. Self-contained; distributable.
- **Export project JSON** — downloads the authoritative `.taroke.json` project file. Suitable for archiving, versioning, and reimporting.
- **Copy JSON** — copies the project JSON to the clipboard.

Below the primary actions:

- **Embedded live preview** — a sandboxed in-browser rendering of the standalone artifact. This is temporary and not the downloaded artifact. Click **Build live artifact preview** (or Rebuild / Refresh / Retry depending on state) to render it. The preview reflects the project state at the moment you last built it. If you have edited the project since the last build, the status reads "Preview is out of date." and the button label changes to **Refresh live artifact preview**.

The preview runs in a sandboxed iframe (`sandbox="allow-scripts"`, no `allow-same-origin`). It cannot access the editor's localStorage. Importing a new file, clicking New, or restoring a draft resets the preview state.

---

## Example route template

A device with inputs `above` (noun, actor), `trans` (verb, action), and `below` (noun, object):

```
{above:plural} {trans:base} the {below:literal}.
```

When the route is selected and slot variables are resolved, a missing slot variable is cleaned rather than leaving doubled punctuation. A line with no usable `above` token produces a clean surface text, not `", verb the object."`.
