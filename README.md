# Outreach Dialer

A mobile-first call-list web app for cold-call client outreach (Utah County coupon newsletter).

Open it on your phone, tap a phone number to dial, then log the outcome
(answered / no answer → interested / not interested + optional note). Companies
are grouped by industry; an industry is flagged **secured** once you land one
interested business, so you know to stop dialing that category.

## Stack
- Static HTML/CSS/JS, no build step.
- Call outcomes saved in the browser via `localStorage`.
- Data layer is isolated in `app.js` so it can be swapped for a Railway backend later.

## Files
- `index.html` — markup
- `styles.css` — styling
- `app.js` — UI + localStorage data layer
- `data.js` — the company list (`window.COMPANIES`)

## Run locally
Just open `index.html`, or serve the folder (e.g. `python -m http.server`).
