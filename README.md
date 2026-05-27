# Onlyseans

Single-page sponsor gallery for Sean Cunningham. The initial drop is a 50-tile wall
(5 columns by 10 rows on large screens) that reuses the Instagram avatar across
all frames until we have more photography to showcase.

## Structure

```
onlyseans/
├── index.html              # Static markup + JS that injects 50 tiles
├── styles.css              # Typography + CSS grid styling
└── public/
    └── images/
        └── sean-avatar.jpg # Downloaded from instagram.com/slcsean_31
```

## Running locally

Open `index.html` directly in a browser or use any static dev server:

```bash
cd onlyseans
python3 -m http.server 5173
# visit http://localhost:5173
```

## Next steps

- Replace duplicated avatar tiles with real sponsor shots when they become
  available.
- Layer in copy modules (CTA, contact, sponsor blurbs) once the gallery order is
  finalized.
- Add responsive tweaks for ultra-wide displays if the grid needs more breathing
  room beyond 5×10.
