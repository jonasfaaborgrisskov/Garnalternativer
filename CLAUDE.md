# Garnalternativer — Project Context

**Projekt:** Garnalternativer.dk  
**Type:** Statisk hjemmeside (HTML/CSS/JS)  
**Status:** MVP klar — afventer domænekøb til lancering

---

## Hvad er projektet?

En hjemmeside der hjælper strikkere med at finde garnalternativer til strikeopskrifter.

**Kerneidé:** Vælg en opskrift → se alternativer i 3 prisniveauer:
- 💰 Budget — markant billigere, samme garnvægt
- ✂️ Godt alternativ — lignende kvalitet, anden pris eller fiber
- 🏆 Premium opgradering — mere eksklusivt end originalen

---

## Tech Stack

- **Frontend:** Rent statisk HTML + CSS + vanilla JavaScript
- **Ingen** build-step, server eller database
- **Hosting:** GitHub Pages (gratis)
- **Repo:** https://github.com/jonasfaaborgrisskov/Garnalternativer
- **Live:** https://jonasfaaborgrisskov.github.io/Garnalternativer/

## Lokal udvikling

Åbn `index.html` direkte i browser. Ingen server nødvendig.

---

## Filstruktur

```
index.html   — Layout og HTML-struktur
style.css    — Komplet design system (Kinfolk/Skandinavisk æstetik)
data.js      — Al data: garnbibliotek (16 garn) + opskrifter (6 stk.)
app.js       — Al logik: rendering, 3-tier display, cost-beregning, matching
CLAUDE.md    — Dette dokument
```

---

## Data-model (data.js)

### Garn
```js
{
  id, name, brand, tier,        // budget | mid | premium
  weight,                        // fingering | sport | DK | worsted | bulky
  gauge: { stitches, needle_mm },
  fiber: [{ name, pct }],        // summerer til 100
  meters_per_50g, price_dkk_50g,
  care, eco, vegan, mulesing_free,
  buyUrl, description
}
```

### Opskrifter
```js
{
  id, name, designer, type, emoji,
  difficulty, description,
  originalYarn_id,               // reference til YARNS[]
  secondaryYarn_id,              // valgfrit (holdes dobbelt)
  totalMeters_M,                 // estimeret garnforbrug str. M
  tags: [],
  tiers: {
    budget:  ['yarn-id', ...],   // redaktionelt kurerede
    mid:     ['yarn-id', ...],
    premium: ['yarn-id', ...],
  }
}
```

---

## Matching-regler

- Samme garnvægt (obligatorisk)
- Max ±2 masker/10 cm afvigelse (standard substitutionsregel)
- Tier-placering er **redaktionelt kureret** — ikke algoritmisk
- Projektkost = `ceil(totalMeters / meters_per_50g) × price_dkk_50g`

---

## Deploy

```bash
git add .
git commit -m "beskrivelse"
git push   # → GitHub Pages opdaterer automatisk (~2 min)
```

---

## Næste skridt

1. Køb `garnalternativer.dk` (One.com / Simply.com, ~70 kr./år)
2. Tilføj DNS-records hos registrar → peg mod GitHub Pages
3. Konfigurer custom domain i repo Settings → Pages
4. Udvid garndatabasen med flere garn og opskrifter
5. Overvej søgefunktion direkte på garnnavn (ikke kun opskrift)

---

## Git / GitHub

- **Dette repo er fuldstændigt separat fra ProductManagement og GenerateOffer**
- Pull requests her går KUN til `jonasfaaborgrisskov/Garnalternativer`
- Branch: `master`

---

## Session-workflow (vigtigt)

**Claude-sessioner i dette repo skal køre direkte i `master` — ikke i en isoleret git-worktree.**

Hvorfor:
- Den lokale udviklingsserver (se `.claude/launch.json`) serverer fra repoets rod (`C:\Users\jonas\github\Garnalternativer`), ikke fra worktrees.
- Hvis sessionen havner i `.claude/worktrees/<branch>/`, ser brugeren IKKE ændringerne i sin browser — de er isoleret på en separat branch.
- Brugerens deploy-flow er simpelt: redigér master lokalt → `git push` → GitHub Pages opdaterer.

Hvis du som AI-agent opdager at sessionen er startet i en worktree (CWD indeholder `.claude/worktrees/`):
1. **Stop og fortæl brugeren** før du laver ændringer.
2. Tilbyd at flytte ændringerne ind i master direkte (kopier fil, eller `git merge`).
3. Brug `ExitWorktree` med `action: "remove"` hvis worktreen blev oprettet i samme session — ellers manuel oprydning efter sessionen via:
   ```bash
   git -C /c/Users/jonas/github/Garnalternativer worktree remove --force .claude/worktrees/<branch>
   git -C /c/Users/jonas/github/Garnalternativer branch -D claude/<branch>
   ```

**Ingen pull requests, ingen feature-branches** — brugeren foretrækker direkte commits til master for dette projekt.
