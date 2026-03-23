# Contract: Application Layout

**Module**: `src/app/app.component.ts`
**Change type**: CSS layout update + element header addition
**Feature**: `003-ui-bohr-fix`

---

## Two-Panel Layout Specification

```
┌─────────────────────────────────────────────────────────────┐
│                     app-root  (100vw × 100vh)               │
│  ┌───────────────┐  ┌──────────────────────────────────────┐│
│  │  .panel-left  │  │            .panel-right              ││
│  │  width: 300px │  │  ┌────────────────────────────────┐  ││
│  │  flex-shrink:0│  │  │       .element-header          │  ││
│  │  overflow-x:  │  │  │  (symbol · name · atomicNumber)│  ││
│  │    auto       │  │  └────────────────────────────────┘  ││
│  │               │  │  ┌────────────────────────────────┐  ││
│  │  app-periodic │  │  │    app-element-viewer          │  ││
│  │  -table       │  │  │    flex: 1 1 auto              │  ││
│  │               │  │  │    min-height: 300px           │  ││
│  │               │  │  └────────────────────────────────┘  ││
│  │               │  │  ┌────────────────────────────────┐  ││
│  │               │  │  │    app-viewer-controls         │  ││
│  │               │  │  │    flex: 0 0 auto              │  ││
│  │               │  │  └────────────────────────────────┘  ││
│  │               │  │  ┌────────────────────────────────┐  ││
│  │               │  │  │    app-element-detail          │  ││
│  │               │  │  │    flex: 0 0 auto              │  ││
│  │               │  │  └────────────────────────────────┘  ││
│  └───────────────┘  └──────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

## CSS Rules

### `.panel-left`
```css
width: 300px;
flex-shrink: 0;
overflow-x: auto;
overflow-y: auto;
```

### `.panel-right`
```css
flex: 1 1 auto;
display: flex;
flex-direction: column;
gap: 8px;
min-width: 0;   /* prevent flex blowout */
```

### `.element-header` (new)
```css
flex: 0 0 auto;
display: flex;
align-items: center;
gap: 12px;
padding: 8px 12px;
background: #161b22;
border: 1px solid #30363d;
border-radius: 6px;
```

### `.viewer` (app-element-viewer host)
```css
flex: 1 1 auto;
min-height: 300px;
```

## Element Header Contract

The `.element-header` section is rendered by `AppComponent` (not `ElementDetailComponent`) and shows:
- Element symbol — large, bold, colored (`#58a6ff`)
- Element name — medium weight
- Atomic number — secondary text (`#8b949e`)
- Hidden (or shows prompt) when no element is selected

`AppComponent` reads `ViewerStateService.selectedElement$` via `toSignal()` for this header.

## ElementDetailComponent Changes

The existing `.hero` section (large symbol + name) MUST be removed from `ElementDetailComponent` to avoid duplication with the new header. `ElementDetailComponent` retains only the `<dl>` property cards section.
