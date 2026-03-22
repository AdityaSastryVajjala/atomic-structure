# Quickstart: Atomic Structure Viewer (Phase 1 MVP)

**Branch**: `002-atomic-structure-viewer` | **Date**: 2026-03-22

This guide covers how to set up, run, build, and validate the application from scratch.

---

## Prerequisites

| Tool | Version | Check |
|------|---------|-------|
| Node.js | 20.x LTS or later | `node --version` |
| npm | 10.x or later | `npm --version` |
| Angular CLI | 19.x | `ng version` |
| Git | Any recent | `git --version` |

Install Angular CLI globally if not present:

```bash
npm install -g @angular/cli
```

---

## Initial Setup

### 1. Clone and switch to the feature branch

```bash
git clone <repository-url>
cd atomic-structure
git checkout 002-atomic-structure-viewer
```

### 2. Install dependencies

```bash
npm install
```

This installs Angular, Three.js, RxJS, and all dev dependencies.

### 3. Verify element data is present

```bash
ls src/assets/data/elements.json
```

If the file is missing, generate it from the pre-processing script:

```bash
node scripts/build-elements-json.js
```

*(This script is created as part of Phase 2: Setup tasks. It fetches the source data and
outputs the validated elements.json per the schema in contracts/elements-json-schema.md.)*

---

## Running the Application

### Development server

```bash
ng serve
```

Open `http://localhost:4200` in Chrome, Firefox, Edge, or Safari (latest).

Expected initial state:
- Periodic table grid shows all 118 elements
- No element selected — viewer panel is empty (no 3D scene)
- No network requests visible in browser DevTools → Network tab

### Verify element selection works

1. Click any element (e.g., **Carbon** — top-left area of the table)
2. Verify the 3D viewer shows 2 rings (shells) and 6 electron spheres
3. Verify the detail panel shows: Carbon | C | 6 | 12.011 u | 2, 4
4. Verify no network requests appear in DevTools → Network tab after initial page load

### Verify interaction controls

1. Click and drag in the viewer → atom should rotate smoothly
2. Scroll up/down in the viewer → view should zoom in/out
3. Click **Reset** → camera returns to default position and angle
4. Click **Pause** → electrons freeze at current positions; button shows "Resume"
5. Click **Resume** → electrons continue from where they stopped
6. Click the **mode toggle** → electrons change from discrete spheres to cloud representation
7. Verify nucleus and shells remain unchanged after mode switch

---

## Running Tests

```bash
ng test
```

This runs all Jasmine/Karma unit tests. The test suite covers:

- `ElementDataService`: loading, caching, error scenarios
- `ViewerStateService`: all state transitions
- `PeriodicTableComponent`: 118 cells rendered, click events
- `ElementDetailComponent`: correct data binding per element
- `AtomRendererService`: scene object counts per element (integration-style)

Expected output: all tests pass, no WebGL errors in test console.

### Run a single test file

```bash
ng test --include='**/element-data.service.spec.ts'
```

---

## Building for Production (Static Hosting)

```bash
ng build --configuration production
```

Output is in `dist/atomic-structure/browser/`. This directory can be deployed to any
static host (GitHub Pages, Netlify, Vercel, S3 + CloudFront) without a server.

### Verify the production build is fully static

```bash
npx serve dist/atomic-structure/browser
```

Open the served URL. Open DevTools → Network. Perform element selections. Confirm:
- No requests go to any external domain
- All resources (JS, CSS, `elements.json`) are served from the local static files
- No 404 errors for any asset

---

## Validation Checklist (run before marking Phase 1 complete)

### Functional

- [ ] All 118 element cells visible in periodic table grid
- [ ] Clicking each of the 14 test elements (see elements-json-schema.md) renders the
      correct number of electron shells (1–7)
- [ ] Detail panel shows correct name, symbol, atomic number, atomic mass, config for each
- [ ] Rotate, zoom, and reset camera work on all 14 test elements
- [ ] Pause freezes electrons; resume continues from same position
- [ ] Mode toggle switches between Bohr and quantum views; nucleus/shells unchanged
- [ ] "Nucleus (simplified)" label visible at all times when element is selected
- [ ] Quantum mode disclaimer visible when mode is 'quantum'
- [ ] Switching between elements rapidly (click 5+ in quick succession) — no artifacts

### Performance

- [ ] Frame rate remains smooth (no visible stutter) for Oganesson (heaviest element, 7 shells)
- [ ] Element switch completes in < 1 second (time from click to rendered scene)
- [ ] Both Bohr and quantum modes smooth for Oganesson

### Error Handling

- [ ] Rename `elements.json` temporarily → app shows error message (FR-024), does not crash
- [ ] Restore `elements.json` → app loads normally on refresh

### Static / Offline

- [ ] Production build opens with DevTools network throttled to "Offline" after initial load
      → already-loaded app continues to work; element selection works; no network errors

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Black / empty viewer | Check browser console for WebGL errors; try Chrome if on another browser |
| `elements.json` 404 | Run `node scripts/build-elements-json.js` and verify file is at `src/assets/data/` |
| `ng serve` fails | Run `npm install` first; verify Node.js is 20.x+ |
| Electrons not moving | Check that the Pause button is not active; try clicking Resume |
| Tests fail with WebGL error | Normal in headless environments; Three.js tests require a real browser via Karma |
