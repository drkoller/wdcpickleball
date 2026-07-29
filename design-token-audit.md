# DCPL Preview Color Architecture Audit

## 1. Executive Summary

This is a static architecture audit of `website-preview/` at commit `80649e1` plus the uncommitted audit document. No implementation change is part of this audit.

The rendered public site consists of eight mutually linked pages: Home, Story, Schedule, Clinics, Ladder Leagues, Tournaments, Gallery, and Contact. Every public page loads `style.css`. Gallery additionally loads `gallery.css`; Contact additionally loads `contact.css`; Clinics, Ladder Leagues, Schedule, Tournaments, and Story contain page-specific inline `<style>` blocks. There are no CSS `@import` rules. Three other HTML files are unlinked visual-review utilities and are not treated as public pages.

The color architecture has two global `:root` layers in `style.css`:

1. The original layer at lines 2–36, now also containing the provisional palette at lines 3–9.
2. A later “DCPL Design Refresh v1” layer at lines 1445–1479.

Because both layers use the same selector specificity (`:root`) and the later layer comes later in the same stylesheet, its declarations win for duplicate names. Consequently, the provisional `--dcpl-blue`, `--dcpl-red`, and `--dcpl-white` values do **not** currently reach rendering. Their legacy definitions at lines 1459, 1456, and 1446 win. The four uniquely named provisional variables (`--dcpl-blue-dark`, `--dcpl-blue-deep`, `--dcpl-yellow`, and `--dcpl-gray`) are valid but unreferenced, so they also have no visual effect.

The active interface remains primarily green/white with red and blue editorial accents. A legacy compatibility layer redefines original variables such as `--green-950`, `--lime`, `--cream`, and `--ink` and points some of them at newer `--dcpl-*` variables. This makes a direct palette swap risky: a single root-value change can affect navigation focus, buttons, hero surfaces, page accents, cards, links, and responsive navigation simultaneously.

The safest migration is component-first and semantic: introduce role-based aliases during a later authorized implementation, migrate one component family at a time, verify every interactive state and breakpoint, and only then merge or retire legacy aliases. Do not resolve the three collisions by globally replacing active values as a first step.

## 2. Public Pages and Active Stylesheets

### Public-page determination

A page is classified as public when it participates in the shared site navigation or is linked by the public pages. All eight public pages have inbound links from the public page set. The three review utilities have zero inbound HTML links, tool-oriented titles, and no shared navigation.

| Status | Page path | Direct local stylesheets | Indirect/external stylesheets | Inline `<style>` | Inline `style` attributes |
|---|---|---|---|---|---|
| Public | `website-preview/index.html` | `style.css` (line 29) | Google Fonts CSS (lines 21–27); no `@import` | None | One non-color image sizing declaration at line 158 |
| Public | `website-preview/our-story.html` | `style.css` (line 29) | Google Fonts CSS (lines 21–27); no `@import` | Lines 31–144 | None |
| Public | `website-preview/schedule.html` | `style.css` (line 19) | Google Fonts CSS (lines 13–18); no `@import` | Lines 21–246 | None |
| Public | `website-preview/clinics.html` | `style.css` (line 13) | Google Fonts CSS (line 12); no `@import` | Lines 15–164 | None |
| Public | `website-preview/leagues.html` | `style.css` (line 19) | Google Fonts CSS (lines 13–18); no `@import` | Lines 21–342 | None |
| Public | `website-preview/tournaments.html` | `style.css` (line 19) | Google Fonts CSS (lines 13–18); no `@import` | Lines 21–330 | None |
| Public | `website-preview/gallery.html` | `style.css` (line 13), then `gallery.css` (line 14) | Google Fonts CSS (line 12); no `@import` | None | None |
| Public | `website-preview/contact.html` | `style.css` (line 13), then `contact.css` (line 14) | Google Fonts CSS (line 12); no `@import` | None | None |
| Standalone review utility; not linked publicly | `website-preview/gallery-review.html` | None | None | Lines 7–107 | None |
| Standalone review utility; not linked publicly | `website-preview/gallery-crop-preview.html` | None | None | Lines 7–112 | None |
| Standalone review utility; not linked publicly | `website-preview/gallery-object-position-preview.html` | None | None | Lines 7–76 | None |

### Stylesheet status

| Stylesheet | Status and evidence |
|---|---|
| `website-preview/style.css` | Active globally: directly loaded by all eight public pages. |
| `website-preview/gallery.css` | Active only on `gallery.html`, loaded after `style.css`; therefore it can override equal-specificity global rules. |
| `website-preview/contact.css` | Active only on `contact.html`, loaded after `style.css`; therefore it can override equal-specificity global rules. |
| Google Fonts CSS | Active external stylesheet on all public pages. It supplies font faces, not the local color system; its returned contents were not vendored and are outside this static color inventory. |
| Other local CSS files | None. Every local `.css` file is loaded by at least one public page. |

The page-specific inline blocks occur after linked CSS in each document head, so they win over equal-specificity declarations in `style.css`. However, the global variables they reference are still resolved from the cascaded custom-property values at computed-value time.

## 3. CSS Cascade and Token Architecture

### Cascade layers that exist in practice

```text
style.css :root (lines 2–36)
    → provisional palette (lines 3–9)
    → original green/lime/cream variables (lines 11–35)

style.css component rules (roughly lines 38–1437)
    → consume original variables and literals

style.css later :root (lines 1445–1479)
    → redefines legacy names and --dcpl-blue/red/white
    → wins duplicate root declarations by equal specificity + later source order

style.css refresh component overrides (lines 1481–1823)
    → override earlier component colors with active --dcpl-* values/literals

page inline CSS or page-specific CSS loaded after style.css
    → adds component variables and page colors
    → later global refresh rules can still win when they are more specific or use inherited custom properties
```

### Important cascade examples

- `--dcpl-blue`: `#163D73` at `style.css:3` is overridden by `#0a3060` at `style.css:1459`. The active focus/link value is `#0a3060`.
- `--dcpl-red`: `#BE1E4A` at `style.css:6` is overridden by `#af0d38` at `style.css:1456`. The active editorial/accent value is `#af0d38`.
- `--dcpl-white`: `#FFFFFF` at `style.css:8` is overridden by equivalent `#ffffff` at `style.css:1446`. This collision is value-equivalent, so resolving only its case/spelling would not alter rendering.
- `--green-950`: `#0b2921` at line 11 is overridden by `#0f332a` at line 1465. All references resolve to the later value.
- `--lime`: `#bce94e` at line 17 is overridden by `var(--dcpl-green-light)` at line 1470, which resolves to `#a8d5b8` from line 1454.
- `--cream`: `#f5f5ef` at line 20 is overridden by `var(--dcpl-white)` at line 1472, resolving to white.
- `--white`, `--ink`, `--muted`, `--line`, and shadow variables are similarly rebound at lines 1473–1478.
- `.button-primary` first uses dark text on lime at `style.css:415–424`, but the later refresh at lines 1523–1532 replaces it with white on legacy green. Inside `.hero`, the more specific rules at lines 1559–1570 replace that again with dark-green text on white.
- `.site-footer` is `#071e18` at line 949, then `#0b2e25` at line 1723. At widths up to 767px, line 1778 changes it to `--dcpl-green-hover` (`#0f392f`).

### Specificity and migration hazards

- `!important` is color-neutral in current code but indicates cascade pressure: reduced-motion declarations at `style.css:1248–1250`, schedule margin at `style.css:1586`, and inline schedule margin at `schedule.html:133`.
- High-specificity state rules include `.hero .button-primary` (`style.css:1559–1570`), `.join-section .button-light` (`1707–1718`), page-scoped schedule buttons (`schedule.html:136–153`), and responsive `.site-nav` rules (`style.css:1752–1762`). A generic token change may not produce uniform component behavior.
- Color media-query changes occur primarily in mobile navigation (`style.css:1752–1762`), mobile footer (`1776–1779`), and a mobile schedule divider (`schedule.html:231–240`). Gallery responsive rules alter layout only, not colors.

## 4. Color Variable Inventory

Counts below cover active local stylesheets and public-page inline style blocks. A “reference” is a `var(--name)` occurrence; definitions are not counted as references unless their value itself calls another variable.

### Global and compatibility variables

| Variable | Definitions: file:line and value | Scope / definitions | References / files | Classification and affected UI |
|---|---|---|---|---|
| `--dcpl-blue` | `style.css:3 #163D73`; `style.css:1459 #0a3060` | `:root`, 2; later wins | 4; `style.css` | Duplicate definition; active legacy token. Focus rings, nav focus, story/gallery links, dark-surface focus shadow. |
| `--dcpl-blue-dark` | `style.css:4 #12325E` | `:root`, 1 | 0 | New preview-palette token; unused. |
| `--dcpl-blue-deep` | `style.css:5 #0C2345` | `:root`, 1 | 0 | New preview-palette token; unused. |
| `--dcpl-red` | `style.css:6 #BE1E4A`; `style.css:1456 #af0d38` | `:root`, 2; later wins | 14; `style.css`, `our-story.html`, `schedule.html`, `leagues.html`, `tournaments.html` | Duplicate definition; active legacy token. Nav underline, labels, stars/eyebrows, schedule/league/tournament accents. |
| `--dcpl-yellow` | `style.css:7 #F7F400` | `:root`, 1 | 0 | New preview-palette token; unused. |
| `--dcpl-white` | `style.css:8 #FFFFFF`; `style.css:1446 #ffffff` | `:root`, 2; later wins, values equivalent | 10; `style.css` | Duplicate definition/semantic base. Page surfaces, aliases, buttons, focus on dark surfaces. |
| `--dcpl-gray` | `style.css:9 #E8EDF3` | `:root`, 1 | 0 | New preview-palette token; unused. |
| `--dcpl-text` | `style.css:1447 #17201c` | `:root`, 1 | 1; `style.css` | Legacy active semantic token; feeds `--ink`, thus body/headings/forms. |
| `--dcpl-muted` | `style.css:1448 #5f6b66` | `:root`, 1 | 1 | Legacy active semantic token; feeds `--muted`, thus descriptive copy. |
| `--dcpl-border` | `style.css:1449 #d9e1dd` | `:root`, 1 | 5 | Legacy active semantic token; header, cards, mobile nav, and `--line`. |
| `--dcpl-surface` | `style.css:1450 #ffffff` | `:root`, 1 | 0 | Unused token; apparent duplicate of `--dcpl-white`. |
| `--dcpl-green` | `style.css:1452 #174a3c` | `:root`, 1 | 7 | Legacy active token. Primary buttons, outlines, story/gallery media fallback, explore action. |
| `--dcpl-green-hover` | `style.css:1453 #0f392f` | `:root`, 1 | 11 | Legacy active token. Button hover, hero/ladder/join/mobile footer, mobile nav text. |
| `--dcpl-green-light` | `style.css:1454 #a8d5b8` | `:root`, 1 | 2 | Legacy active token/alias target. Section eyebrows and `--lime`. |
| `--dcpl-red-hover` | `style.css:1457 #8e0a2e` | `:root`, 1 | 1 | Component/state token; desktop nav hover. |
| `--dcpl-blue-hover` | `style.css:1460 #07274e` | `:root`, 1 | 1 | Component/state token; story/gallery link hover. |
| `--dcpl-shadow` | `style.css:1462 0 12px 34px rgba(16,54,43,.1)` | `:root`, 1 | 3 | Color-bearing semantic effect token; cards/explore/gallery. |
| `--dcpl-stars` | `style.css:1463 data SVG with encoded #AF0D38` | `:root`, 1 | 1 | Component-specific active token; three-star graphic at `.dc-star-label::after`. Embedded color will not follow `--dcpl-red`. |

### Rebound legacy variables

| Variable | Definitions | References | Classification / effective value / main consumers |
|---|---|---:|---|
| `--green-950` | `style.css:11 #0b2921`; `1465 #0f332a` | 20 | Duplicate legacy active token; later `#0f332a` wins. Body headings, nav text, outline buttons, schedule text. |
| `--green-900` | `style.css:12 #123b30`; `1466 #174a3c` | 0 | Duplicate unused token. The literal `#123b30` also remains in theme-color metadata, outside CSS. |
| `--green-850` | `style.css:13 #184839`; `1467 #1b5343` | 0 | Duplicate unused token. |
| `--green-800` | `style.css:14 #205442`; `1468 #245e4c` | 12 | Duplicate legacy active token; later wins. Page media fallbacks and some page-specific hover backgrounds. |
| `--green-700` | `style.css:15 #2b6952`; `1469 #2d6c57` | 19 | Duplicate legacy active token; later wins. Links, outline borders/hover, gallery controls. |
| `--lime` | `style.css:17 #bce94e`; `1470 var(--dcpl-green-light)` | 8 | Duplicate semantic alias; effective `#a8d5b8`. Earlier focus/button/eyebrow rules, some of which are later overridden. |
| `--lime-dark` | `style.css:18 #9fd039`; `1471 #8cc3a0` | 2 | Duplicate state token; effective `#8cc3a0`. Earlier primary-button hover is later overridden globally. |
| `--cream` | `style.css:20 #f5f5ef`; `1472 var(--dcpl-white)` | 16 | Duplicate semantic alias; effective white. Public page intro/card surfaces. |
| `--white` | `style.css:21 #ffffff`; `1473 var(--dcpl-white)` | 31 | Duplicate semantic alias; effective white. Text and surfaces across all pages. |
| `--ink` | `style.css:23 #17201c`; `1474 var(--dcpl-text)` | 8 | Duplicate semantic alias; effective `#17201c`. Body/card/form text. |
| `--muted` | `style.css:24 #637069`; `1475 var(--dcpl-muted)` | 29 | Duplicate semantic alias; effective `#5f6b66`. Descriptive text on every page. |
| `--line` | `style.css:25 #dce2de`; `1476 var(--dcpl-border)` | 2 | Duplicate semantic alias; effective `#d9e1dd`. Contact accordion dividers. |
| `--shadow-small` | `style.css:27 rgba(11,41,33,.08)`; `1477 rgba(16,54,43,.08)` | 4 | Duplicate active effect token; cards/photos/header. |
| `--shadow-large` | `style.css:28 rgba(11,41,33,.16)`; `1478 var(--dcpl-shadow)` | 3 | Duplicate semantic alias; story/clinic media. |

### Component-scoped color variables

| Variable | Definitions | References | Classification / affected UI |
|---|---|---:|---|
| `--schedule-accent` | `style.css:1582 var(--dcpl-red)` on three schedule sections; `schedule.html:25 var(--dcpl-red)` on same sections | 4 | Duplicate component-specific semantic alias; same computed value, no visual conflict. Schedule eyebrow, dates, statuses, icons. |
| `--schedule-border` | `schedule.html:26 rgba(11,41,33,.11)` | 4 | Component-specific token. Weekly rows/cards and event dividers. |
| `--schedule-card` | `schedule.html:27 var(--cream)` | 3 | Component-specific semantic alias; resolves to white. |
| `--league-accent` | `style.css:1591 var(--dcpl-red)` on two containers; `leagues.html:23` and `79`, both `var(--dcpl-red)` | 2 | Three definitions, component-specific duplicate; same value. League icons/arrows. |
| `--league-card-border` | `leagues.html:82 rgba(11,41,33,.11)` | 2 | Component-specific token; row/card borders. |
| `--league-card-background` | `leagues.html:83 var(--cream)` | 2 | Component-specific semantic alias; effective white. |
| `--tournament-accent` | `style.css:1596 var(--dcpl-red)` on two containers; `tournaments.html:23` and `83`, both `var(--dcpl-red)` | 2 | Three definitions, component-specific duplicate; same value. Tournament labels/icons. |
| `--tournament-card-border` | `tournaments.html:85 rgba(11,41,33,.11)` | 1 | Component-specific token; tournament cards. |
| `--tournament-card-background` | `tournaments.html:86 var(--cream)` | 1 | Component-specific semantic alias; effective white. |

Non-color layout custom properties (radii, dimensions, gaps, container width, and header height) were inspected but are outside this color inventory. `--header-height` has responsive redefinitions at `style.css:1071` and `1136`; they do not alter color behavior.

## 5. Component Dependency Map

### Shared interface

```text
Desktop navigation surface
    → .site-header background (style.css:215)
    → --white
    → --dcpl-white
    → active #ffffff

Desktop navigation text
    → .site-header/.brand/.brand-title (214, 246, 275)
    → --green-950
    → active #0f332a

Desktop nav underline / active marker
    → .site-nav a::after (1507–1509)
    → --dcpl-red
    → active legacy #af0d38

Desktop nav hover / focus
    → hover --dcpl-red-hover → #8e0a2e (1511–1513)
    → focus --dcpl-blue → active legacy #0a3060 (1515–1517)

Mobile navigation (≤1080px)
    → .site-nav background --dcpl-white → #ffffff (1752–1756)
    → links --dcpl-green-hover → #0f392f (1759–1761)
    → borders --dcpl-border → #d9e1dd (1756, 1761)
    → menu hover rgba(175,13,56,.07) (1519–1521)

Global focus
    → :focus-visible --dcpl-blue → active #0a3060 (1485–1487)
    → nav/brand/menu rgba(10,48,96,.58) (1489–1493)
    → dark sections white outline + blue outer shadow (1495–1500)
```

### Hero and buttons

```text
Hero fallback surface
    → .hero (1545–1547 wins over 468)
    → --dcpl-green-hover
    → #0f392f

Hero photographic overlay
    → .hero-shade (1549–1556 wins over 480–489)
    → rgba(5,20,16,.12) → rgba(5,20,16,.16) → rgba(8,36,29,.86)

Hero heading/default text
    → inherited --white / --dcpl-white
    → #ffffff

Hero body text
    → .hero-description rgba(255,255,255,.86) (499–503)

Primary button outside hero
    → .button-primary (1523–1532 wins over 415–424)
    → white text / --dcpl-green #174a3c
    → hover --dcpl-green-hover #0f392f

Hero primary CTA
    → .hero .button-primary (1559–1570)
    → text --dcpl-green-hover #0f392f
    → surface --dcpl-white #ffffff
    → hover surface #f1f7f3

Secondary CTA
    → .button-secondary (427–435)
    → white text; rgba(255,255,255,.08) surface; rgba(255,255,255,.48) border
    → hover surface rgba(255,255,255,.15)

Outline CTA
    → .button-outline (1535–1543)
    → --dcpl-green #174a3c text/border
    → hover white on #174a3c

Schedule outline CTA (higher page specificity)
    → schedule.html:136–153
    → --green-950 #0f332a on transparent, --green-700 #2d6c57 border
    → hover white on --green-700
```

### Homepage sections

```text
Story preview
    → surface --white → #ffffff (537–539)
    → media fallback refresh --dcpl-green → #174a3c (1615–1618)
    → photo label rgba(15,51,42,.88) (1620–1622)
    → link --dcpl-blue/#0a3060; hover #07274e (1605–1612)

Explore cards
    → section/card --dcpl-white → #ffffff (1624–1629)
    → border --dcpl-border → #d9e1dd (1631–1633)
    → icon/arrow --dcpl-red → #af0d38 (1599–1603)
    → icon tint rgba(175,13,56,.075) (1642–1644)
    → hover border rgba(175,13,56,.42), shadow --dcpl-shadow (1636–1640)

Ladder section
    → surface --dcpl-green-hover → #0f392f (1650–1653)
    → body white/rgba(255,255,255,.86)
    → eyebrow --dcpl-green-light → #a8d5b8 (1655–1657)
    → numbers #f7fbf9 (1659–1661)
    → stat labels rgba(255,255,255,.84), dividers rgba(...,.22) (1663–1669)

Homepage gallery
    → section --dcpl-white → #ffffff
    → cards --dcpl-green → #174a3c (1615–1618)
    → link active legacy blue #0a3060 / hover #07274e

Join section
    → surface --dcpl-green-hover #0f392f
    → white and translucent-white text
    → light button dark-green on white; hover #f1f7f3 (1707–1718)
```

### Interior pages and footer

```text
Schedule
    → accent --schedule-accent → --dcpl-red → #af0d38
    → card --schedule-card → --cream → --dcpl-white → #ffffff
    → border rgba(11,41,33,.11)
    → red tints rgba(201,71,61,.08/.12), which do not exactly match active --dcpl-red

Ladder Leagues
    → accent --league-accent → --dcpl-red → #af0d38
    → card background --cream → white; border rgba(11,41,33,.11)
    → icons use rgba(201,71,61,.09), hover border rgba(...,.45)
    → action hover white on --green-800 → active #245e4c

Tournaments
    → accent --tournament-accent → --dcpl-red → #af0d38
    → card background --cream → white; border rgba(11,41,33,.11)
    → icons use rgba(201,71,61,.09)
    → action hover white on --green-800 → #245e4c

Story page
    → photo fallback --green-800 → #245e4c (our-story.html:45)
    → overlay rgba(11,41,33,.08→.86) (line 54)
    → heading --white → #ffffff; label --dcpl-red → #af0d38 (83–94)

Gallery / lightbox
    → intro/card --cream → white (gallery.css:1,7)
    → links --green-700 → #2d6c57 (line 12)
    → lightbox rgba(4,15,12,.94) (line 14)
    → controls white on rgba(18,59,48,.86), white-alpha border (line 17)
    → hover --green-700 #2d6c57 (line 18)

Contact cards/forms
    → cards --cream → white, border rgba(11,41,33,.1) (contact.css:34–40)
    → inputs --ink on --white with literal #cbd4ce border (107–115)
    → links/accordion icons --green-700 #2d6c57
    → dividers --line → #d9e1dd

Footer desktop
    → .site-footer later literal #0b2e25 (style.css:1721–1724)
    → white and rgba(255,255,255,.72) text
    → hover literal #e6a5b6 (1743–1746)
    → divider rgba(255,255,255,.15)

Footer mobile ≤767px
    → --dcpl-green-hover → #0f392f (1776–1779)
```

## 6. Hard-Coded Color Inventory

“Hard-coded” here means a literal in an active stylesheet or public inline style, including literals used to define custom properties. Equivalent hex case is normalized in summaries, but original syntax and locations are retained. Image pixels are excluded. Metadata `theme-color` is noted separately because it affects browser chrome rather than page CSS.

### Literal definitions in global variables

| Normalized value | Original syntax and exact locations | Occurrences | Visible status / migration disposition |
|---|---|---:|---|
| `#163d73` | `style.css:3`, `--dcpl-blue: #163D73` | 1 | Overridden; not visible. Keep provisional source, migrate deliberately. |
| `#12325e` | `style.css:4`, `--dcpl-blue-dark: #12325E` | 1 | Unreferenced; not visible. |
| `#0c2345` | `style.css:5`, `--dcpl-blue-deep: #0C2345` | 1 | Unreferenced; not visible. |
| `#be1e4a` | `style.css:6`, `--dcpl-red: #BE1E4A` | 1 | Overridden; not visible. |
| `#f7f400` | `style.css:7`, `--dcpl-yellow: #F7F400` | 1 | Unreferenced; not visible. |
| `#ffffff` | `style.css:8 #FFFFFF`, `21 #ffffff`, `1446 #ffffff`, `1450 #ffffff` | 4 | Active through later aliases; merge to semantic surface/text roles later. |
| `#e8edf3` | `style.css:9`, `--dcpl-gray` | 1 | Unreferenced; not visible. |
| Original green set | `style.css:11 #0b2921`, `12 #123b30`, `13 #184839`, `14 #205442`, `15 #2b6952` | 5 | All overridden; `--green-900/850` also unreferenced. Remove only after migration validation. |
| Original lime/cream set | `style.css:17 #bce94e`, `18 #9fd039`, `20 #f5f5ef` | 3 | Overridden by later aliases/values; not currently visible via these variables. |
| Original text/line set | `style.css:23 #17201c`, `24 #637069`, `25 #dce2de` | 3 | `#17201c` is value-equivalent to active text; muted/line are overridden. |
| Active text neutrals | `style.css:1447 #17201c`, `1448 #5f6b66`, `1449 #d9e1dd` | 3 | Visible. Convert/retain as semantic text and border tokens. |
| Active greens | `style.css:1452 #174a3c`, `1453 #0f392f`, `1454 #a8d5b8`; compatibility `1465 #0f332a`, `1466 #174a3c`, `1467 #1b5343`, `1468 #245e4c`, `1469 #2d6c57`, `1471 #8cc3a0` | 9 declarations, 8 distinct values | Visible except unreferenced `--green-900/850`; replace component-by-component. `#174a3c` has two variable definitions. |
| Active red set | `style.css:1456 #af0d38`, `1457 #8e0a2e`; encoded `#AF0D38` inside `--dcpl-stars` at 1463 | 3 | Visible. Stars are independently embedded and will not follow a token swap. |
| Active blue set | `style.css:1459 #0a3060`, `1460 #07274e` | 2 | Visible in focus and links. Replace during Stage 1/2 with explicit roles. |
| Shadow colors | `style.css:27 rgba(11,41,33,.08)`, `28 rgba(...,.16)`, `1462 rgba(16,54,43,.1)`, `1477 rgba(16,54,43,.08)` | 4 | Active later values; convert to effect tokens after surface migration. |

### Active literals outside variable definitions

| Value/group | Exact file:line; selector/property | Count in cited group | UI / visible? / tokenize? |
|---|---|---:|---|
| `rgba(10,48,39,.08/.64/.06/.09)` | `style.css:216` header border; `285` brand-location text; `314` menu hover; `1327` mobile-nav shadow; `1352` mobile-nav border | 5 | Active shared navigation. Convert to semantic border/muted/hover/elevation tokens during Stage 1. |
| `rgba(188,233,78,.55/.19)` | `style.css:348` legacy focus outline; `424` legacy button-hover shadow | 2 | Line 348 overridden in the refresh focus rule for the same elements; line 424 overridden by later primary-button shadow. Appears non-winning, but confirm computed styles before removal. |
| Transparent/`currentColor` | `style.css:91,226,307,323,400,449,455,587,1562,1569,1710,1717`; `schedule.html:141`; `leagues.html:145`; `tournaments.html:138`; `contact.css:68` | 16 | Active structural color behaviors. Keep `currentColor`; transparent values are state/surface semantics rather than palette colors. |
| White alpha: `.08/.10/.15/.18/.22/.34/.45/.48/.55/.72/.78/.80/.82/.84/.86` | `style.css:429–434,450,502,522,532,785,804,818,931,948,978,991,1664,1668,1749,1814`; `gallery.css:17,22` | 20 cited declarations | Active text, borders, controls, and overlays. Consolidate by role rather than alpha alone; exact contrast depends on backdrop. |
| Black alpha | `style.css:444 rgba(0,0,0,.14)` button shadow; `1328 rgba(0,0,0,.12)` mobile-nav shadow | 2 | Active elevation; convert to shadow tokens late. |
| Hero green/black overlays | Earlier `style.css:486–488 rgba(5,19,15,.15/.83)`; winning `1553–1555 rgba(5,20,16,.12/.16), rgba(8,36,29,.86)` | 6 | Earlier gradient is overridden by the later `.hero-shade`; winning gradient is visible over photography. Create hero-overlay semantic tokens only after image/contrast testing. |
| Story/page overlays | `style.css:568 rgba(11,41,33,.82)` overridden by `1621 rgba(15,51,42,.88)`; `our-story.html:54 rgba(11,41,33,.08/.86)` | 4 | Story label winning value and Story-page image gradient are visible. Tokenize by overlay role. |
| `#c9473d` and matching red tints | `style.css:690,727 #c9473d`; `style.css:680 rgba(201,71,61,.4)`, `691 rgba(...,.09)` | 4 | Earlier explore red is overridden by refresh rules at 1599–1644. Candidate dead declarations, pending computed-style confirmation. |
| Active legacy-red tints | `style.css:1520 rgba(175,13,56,.07)`, `1638 rgba(...,.42)`, `1643 rgba(...,.075)` | 3 | Active menu/card interaction tints. Convert to semantic hover/subtle-accent tokens. |
| Schedule red tints | `schedule.html:109,174,190 rgba(201,71,61,.08)`; `110,239 rgba(...,.12)` | 5 | Active, but hue `rgb(201,71,61)` differs from active `#af0d38` and provisional `#be1e4a`. Replace with semantic accent-subtle/divider during Stage 3. |
| League/tournament red tints | `leagues.html:138,203 rgba(201,71,61,.09)`, `213 rgba(...,.45)`; `tournaments.html:131 rgba(...,.09)` | 4 | Active icons/hover borders; same hue mismatch as Schedule. |
| Green border/shadow alpha | `rgba(11,41,33,.11)` at `style.css:673`, `schedule.html:26`, `leagues.html:82`, `tournaments.html:85`; `.12` at `leagues.html:176`, `tournaments.html:219`; `.13` at `schedule.html:157,207`; `.10` at `contact.css:38`; `.07` at `clinics.html:81`, `leagues.html:214`; `.08` at `schedule.html:78` | 12 cited declarations | Active borders/elevation. Merge into semantic border/shadow roles after cards migrate. |
| Gallery lightbox literals | `gallery.css:14 rgba(4,15,12,.94)` overlay; `17 rgba(18,59,48,.86)` control, `rgba(255,255,255,.34)` border; `22 rgba(255,255,255,.78)` position | 4 | Active. Convert to overlay/control tokens during Stage 3; verify image-dependent contrast. |
| Contact input border | `contact.css:113 #cbd4ce`, `.contact-field input/textarea border` | 1 | Active. Convert to form-border semantic token; verify focus differentiation. |
| Ladder winning literals | `style.css:1660 #f7fbf9`; `1664 rgba(255,255,255,.84)`; `1668` and `1814 rgba(...,.22)` | 4 | Active numbers/labels/dividers. Convert to on-dark text/divider roles during Stage 2. |
| Light CTA hover | `style.css:1568` and `1716 #f1f7f3` | 2 | Active Hero and Join hover surfaces. Merge into an action-hover-on-dark semantic token. |
| Footer literals | Earlier `style.css:949 #071e18` overridden by `1723 #0b2e25`; `1745 #e6a5b6` hover; `1749 rgba(255,255,255,.15)` divider | 4 | Active except `#071e18`; tokenize in Stage 4. Mobile footer uses variable instead of desktop literal. |
| Dormant Story hero literals | `style.css:1388 #fff`, `1392–1393 rgba(10,32,58,.72)`, `1406 rgba(255,255,255,.75)`, `1420 rgba(255,255,255,.9)` in `.story-page-hero*` | 6 | Selector has no match in any public HTML; referenced image is also absent. Potential dead code, but investigate before removal. |

`theme-color` metadata uses literal `#123b30` in `clinics.html:7`, `leagues.html:10`, `schedule.html:10`, `tournaments.html:10`, and `our-story.html:16`. It affects supported browser UI, not CSS rendering, and should eventually receive a dedicated metadata token/build process rather than a CSS custom property.

No `rgb()` (without alpha), `hsl()`, or `hsla()` literals were found in active local styles. No literal named `white` or `black` declaration value was found; white is expressed through variables/hex/rgba. `currentColor` appears at `style.css:323`, `contact.css:68`, `leagues.html:145`, and `tournaments.html:138` and correctly propagates component text color to icons.

## 7. Duplicate Definitions, Overrides, and Potential Dead Code

### Confirmed duplicate/override groups

- Provisional versus refresh collisions: `--dcpl-blue`, `--dcpl-red`, `--dcpl-white` (`style.css:3/1459`, `6/1456`, `8/1446`). Later root declarations win.
- Legacy compatibility redefinitions: `--green-950/900/850/800/700`, `--lime`, `--lime-dark`, `--cream`, `--white`, `--ink`, `--muted`, `--line`, `--shadow-small`, and `--shadow-large` are each defined twice. Lines 1465–1478 win globally.
- Component aliases: `--schedule-accent` is defined twice; `--league-accent` and `--tournament-accent` three times each. Values are equivalent (`var(--dcpl-red)`), so the duplicates do not currently produce different colors.
- Same literal across different variables: `#ffffff` is represented by `--dcpl-white`, `--dcpl-surface`, and the first `--white`; `#17201c` by the first `--ink` and `--dcpl-text`; `#174a3c` by `--dcpl-green` and later `--green-900`.
- Same apparent semantic purpose with different hues: active `--dcpl-red #af0d38`, provisional `#BE1E4A`, older explore `#c9473d`, and many `rgba(201,71,61,alpha)` tints all represent “red accent” but are not chromatically equivalent.

### Unreferenced variables

Static reference count is zero for:

- New palette: `--dcpl-blue-dark`, `--dcpl-blue-deep`, `--dcpl-yellow`, `--dcpl-gray`.
- Legacy/refresh: `--green-900`, `--green-850`, `--dcpl-surface`.
- The provisional declarations of `--dcpl-blue`, `--dcpl-red`, and `--dcpl-white` are not separately referenceable because their names are overridden; references resolve to the later definitions.

### Overridden declarations that appear non-winning

- Earlier `.button-primary` colors at `style.css:415–424` are replaced by lines 1523–1532 on public pages; Hero has a further specific override at 1559–1570.
- Earlier Hero fallback/gradient at `style.css:468,483–489` is replaced by lines 1545–1556.
- Earlier explore red declarations at `style.css:680,690–691,727` are replaced by refresh rules at 1599–1644.
- Earlier ladder/join colors at `style.css:757–818,913–931` are partly replaced at 1650–1669 while translucent white body copy remains active.
- Earlier footer background `#071e18` at `style.css:949` is replaced by desktop `#0b2e25` at 1723 and mobile `--dcpl-green-hover` at 1778.

These conclusions follow same-selector or higher-specificity later declarations in the same stylesheet. Browser computed-style verification is still recommended before deletion because state, inheritance, and missing-class scenarios can expose fallback rules.

### Potential unused selectors/files

- `.story-page-hero`, `.story-page-hero-inner`, and related descendants at `style.css:1384–1435` have no matching class in any public HTML (`rg` finds the names only in CSS). Their referenced `images/our-story-hero.jpg` does not exist. Evidence strongly suggests this block is unused, but it should remain classified **potential dead code** until runtime coverage confirms no JavaScript injects the class. Current JavaScript contains no matching string.
- The three unlinked gallery review HTML files are standalone review utilities, not public-page dependencies. Their inline CSS is not active on public pages. They are not necessarily dead files; their names/titles indicate intentional tooling.
- No local stylesheet is globally unused: all three `.css` files have at least one direct public-page load.
- Selector-level usage across dynamic Gallery/Contact states cannot be proven completely by static markup because JavaScript creates/toggles classes such as lightbox/open states. Those selectors are **uncertain**, not dead.

### Media queries and migration complexity

- At `≤1080px`, navigation changes to explicit white/dark-green/border tokens (`style.css:1752–1762`).
- At `≤767px`, footer background changes from literal desktop `#0b2e25` to `--dcpl-green-hover` (`1776–1779`).
- At `≤580px`, Schedule changes a red-tint vertical divider to a bottom divider (`schedule.html:231–240`).
- Focus and reduced-motion rules use `!important` only for motion/dimensions, not color. No color declaration currently uses `!important`.

## 8. Preview-Palette Collision Analysis

| Provisional token | Definition | Later override? | Current rendering effect | Collision and likely visible change if made active |
|---|---|---|---|---|
| `--dcpl-blue: #163D73` | `style.css:3` | Yes: `#0a3060` at 1459 | None from provisional value | Name collides with active legacy blue. Activating it would lighten/change global focus outlines, nav focus, Story link, Gallery link, and dark-section focus shadow. |
| `--dcpl-blue-dark: #12325E` | `style.css:4` | No | None; zero references | No direct name collision. Intended hover/gradient role overlaps semantically with `--dcpl-blue-hover` and dark-green surfaces, but no current selector consumes it. |
| `--dcpl-blue-deep: #0C2345` | `style.css:5` | No | None; zero references | No name collision. Intended deep-surface role overlaps with literal footer backgrounds and `--dcpl-green-hover`; activation should be component-scoped. |
| `--dcpl-red: #BE1E4A` | `style.css:6` | Yes: `#af0d38` at 1456 | None from provisional value | High-impact collision. Activating globally would change nav underline, labels, stars only where stars are text/variable-driven, page accents, schedule/league/tournament icons, and hover relationships. Encoded star SVG would remain old red unless separately migrated. Existing red alpha tints would also remain mismatched. |
| `--dcpl-yellow: #F7F400` | `style.css:7` | No | None; zero references | No direct name collision. Intended action role overlaps semantically with legacy `--lime`/`--lime-dark`, but current buttons are mostly green or white after refresh overrides. |
| `--dcpl-white: #FFFFFF` | `style.css:8` | Yes: `#ffffff` at 1446 | No distinguishable effect; values are identical | Name collision but value-equivalent. A declaration consolidation would be visually safe only after confirming no tooling treats spelling/case specially. |
| `--dcpl-gray: #E8EDF3` | `style.css:9` | No | None; zero references | No direct collision. Intended border role overlaps with `--dcpl-border`, `--line`, and literal `#cbd4ce`. |

A temporary naming layer can be safer than resolving collisions in place. During a later implementation, role-based names such as `--color-brand-primary`, `--color-action-primary`, `--color-surface-deep`, `--color-text-primary`, `--color-border-subtle`, and `--color-accent-editorial` can point to provisional palette values while old components retain legacy aliases. This prevents a single root edit from recoloring unrelated components. Temporary names should be explicitly documented and removed after migration; they should not become a second permanent palette taxonomy.

## 9. Accessibility Findings

Ratios below are exact WCAG relative-luminance calculations for opaque hex pairs. AA normal text requires 4.5:1; large text requires 3:1. Non-text UI boundaries/focus indicators generally require 3:1 against adjacent colors. Alpha overlays on images cannot have one exact ratio without the underlying pixel color and require browser/image sampling.

| Pair | Exact ratio | Finding |
|---|---:|---|
| Active body `#17201c` on white | 16.67:1 | Passes AAA. |
| Active muted `#5f6b66` on white | 5.55:1 | Passes AA normal text, not AAA. |
| White on active `--dcpl-green #174a3c` | 10.09:1 | Passes AAA; used by primary buttons. |
| White on active `--dcpl-green-hover #0f392f` | 12.75:1 | Passes AAA; used by dark sections/button hover. |
| White on active legacy blue `#0a3060` | 13.09:1 | Passes AAA, though white-on-blue is not currently a primary filled component. |
| Preview deep blue `#0c2345` on preview yellow `#f7f400` | 13.33:1 | Passes AAA; suitable candidate for yellow CTA labels. |
| White on active legacy red `#af0d38` | 7.15:1 | Passes AAA at exactly above 7:1. |
| White on provisional red `#be1e4a` | 6.04:1 | Passes AA normal text, not AAA. |
| Active nav text `#0f332a` on white | 13.75:1 | Passes AAA. |
| Nav hover `#8e0a2e` on white | 9.40:1 | Passes AAA. |
| Nav focus blue `#0a3060` on white | 13.09:1 | Passes AAA. |
| Section eyebrow `#a8d5b8` on `#0f392f` | 7.82:1 | Passes AAA. |
| Provisional blue `#163d73` on white | 10.77:1 | Passes AAA. |
| Provisional dark blue `#12325e` on white | 12.78:1 | Passes AAA. |

Risks and structural concerns:

- Hero copy uses white or `rgba(255,255,255,.86)` over a photograph plus gradient. The gradient is strong near the bottom but contrast varies spatially; sample worst-case image regions at desktop/mobile crops.
- Story-page heading and red label sit on a photo gradient (`our-story.html:50–54`). The red label may have insufficient contrast on some underlying pixels despite the nominal red being dark enough on white; browser/image sampling is required.
- Gallery controls use white on a translucent green control over arbitrary photos (`gallery.css:17`). Verify the composited result and the 1px translucent border against both overlay and image.
- Secondary/transparent buttons use translucent white surfaces/borders (`style.css:427–450`). Their text is white and likely readable on dark Hero, but UI-component boundary contrast can vary with photography.
- Focus on ordinary surfaces uses active blue and should be strong. Dark-surface focus uses a white outline plus blue shadow (`style.css:1495–1500`); the blue outer shadow may disappear against dark green, but the white outline provides the primary indicator. Verify clipping and 3:1 adjacent contrast.
- Contact inputs have only a `#cbd4ce` border on white until generic focus styling applies. The border itself is low contrast; ensure the blue focus outline is consistently visible and error/success states are not color-only.
- Active states are expressed mainly via nav underline/current-page semantics and button hover transforms. Keyboard and touch active/pressed states are not consistently color-distinct and need interaction testing, though no failure can be concluded from static CSS alone.
- The new yellow is very bright. It should not be used as body text on white. Deep-blue text on yellow is excellent; white text on yellow would fail and should be avoided.

## 10. Recommended Token Architecture

Recommendations are for later work only.

| Group | Recommendation | Reason |
|---|---|---|
| Provisional seven-color palette | KEEP | Preserve as source palette, but do not bind raw palette tokens directly to every component. |
| Colliding `--dcpl-blue`, `--dcpl-red`, `--dcpl-white` | INVESTIGATE FURTHER, then MERGE | Three names have two root definitions. Resolve only alongside component migration and visual tests. White is value-equivalent; blue/red are not. |
| `--dcpl-blue-dark`, `--dcpl-blue-deep`, `--dcpl-yellow`, `--dcpl-gray` | KEEP | Valid unused palette primitives awaiting semantic aliases. |
| `--dcpl-text`, `--dcpl-muted`, `--dcpl-border` | CONVERT TO SEMANTIC TOKEN | Their roles are sound; names/values should align with the final neutral system. |
| `--dcpl-surface` | MERGE | Unused and duplicates white. Merge into a defined surface hierarchy later. |
| `--dcpl-green*`, `--green-*`, `--lime*` | REPLACE DURING MIGRATION | They drive current visuals. Replace per component, not globally. |
| `--cream`, `--white`, `--ink`, `--muted`, `--line` | MERGE | These are compatibility aliases. Retain until all references use a single semantic layer. |
| `--schedule/league/tournament-accent` | KEEP then CONVERT TO SEMANTIC TOKEN | Component scoping is useful; point all to one editorial-accent role and remove redundant definitions later. |
| Component border/background variables | CONVERT TO SEMANTIC TOKEN | Preserve scoping while replacing literal green/red alpha values with shared border/surface roles. |
| `--dcpl-stars` | REPLACE DURING MIGRATION | Embedded SVG color is frozen; make it consume a maintainable asset/token strategy when red migrates. |
| Shadow variables | MERGE | Multiple green-tinted shadows represent a single elevation system with inconsistent literals. |
| Unreferenced `--green-900`, `--green-850` | REMOVE AFTER MIGRATION | Zero static references; wait for runtime confirmation. |
| Potential `.story-page-hero` block | INVESTIGATE FURTHER | No markup/JS match and missing asset, but confirm deployment/runtime history before removal. |
| Repeated alpha literals | CONVERT TO SEMANTIC TOKEN | Name by role (`border-subtle`, `overlay-strong`, `accent-subtle`) rather than by alpha. |
| `currentColor` icon behavior | KEEP | Correctly ties icons to component state colors. |

Suggested future semantic layers:

```text
Palette primitives
    --palette-blue / blue-dark / blue-deep / red / yellow / white / gray

Semantic roles
    --color-brand-primary
    --color-brand-primary-hover
    --color-accent-editorial
    --color-action-primary
    --color-action-primary-text
    --color-surface-page / raised / deep
    --color-text-primary / secondary / on-dark
    --color-border-subtle / strong
    --color-focus-ring
    --color-overlay-hero / lightbox

Component aliases only where needed
    --nav-background / nav-text / nav-active
    --button-primary-* / button-secondary-*
    --schedule-accent, --gallery-control-*, --footer-*
```

This separates brand primitives from UI meaning and permits temporary coexistence with the legacy system.

## 11. Incremental Migration Plan

### Stage 1 — Navigation, Hero, Hero CTA buttons, states

- **Selectors:** `.site-header`, `.brand*`, `.site-nav*`, `.menu-button*`, `.hero*`, `.button-primary`, `.hero .button-primary`, `.button-secondary`, global/dark-section `:focus-visible`; responsive rules at `style.css:1752–1762`.
- **Existing variables/literals:** `--green-950`, `--dcpl-white`, `--dcpl-red`, `--dcpl-red-hover`, `--dcpl-blue`, `--dcpl-green`, `--dcpl-green-hover`; header alpha literals at 216/285/314; Hero gradient at 1553–1555; translucent button/border values at 429–450.
- **Main risks:** three colliding names; Hero photo-dependent contrast; more-specific Hero button rules; desktop/mobile nav divergence; focus visibility; external `theme-color` metadata remaining green.
- **Verification:** pixel baselines at 1440, 1080, 767, 650, and 390px; open/close mobile menu; current/hover/focus/active states; keyboard traversal; Hero image worst-case contrast; no layout shift.

### Stage 2 — Homepage sections, Ladder, cards, Story preview

- **Selectors:** `.story-section`, `.story-photo*`, `.story-toggle`, `.explore-*`, `.ladder-*`, homepage `.gallery-*`, `.join-*`.
- **Existing variables/literals:** active legacy blue link pair, `--dcpl-green*`, `--dcpl-red`, `--dcpl-border`, `--dcpl-shadow`, encoded `--dcpl-stars`, `#f7fbf9`, white-alpha ladder values, red-alpha card values, `#f1f7f3` hover.
- **Main risks:** refresh rules override earlier styles; stars retain embedded old red; card hover/focus share selectors; Ladder numbers/dividers require on-dark contrast; responsive two-column/flex changes.
- **Verification:** compare every section at desktop/mobile; hover/focus each card and link; verify Ladder statistic layout at ≤767px; contrast-test all on-dark text and dividers; check star color and sizing.

### Stage 3 — Interior pages, Schedule, Story, Gallery/lightbox, Forms

- **Selectors/files:** inline blocks in `clinics.html`, `schedule.html`, `leagues.html`, `tournaments.html`, `our-story.html`; `gallery.css`; `contact.css`.
- **Existing variables/literals:** component accent/card/border variables; `rgba(201,71,61,*)` tint family; `--green-700/800/950`; Story photo gradient; Gallery overlay/control alpha colors; Contact `#cbd4ce` input border.
- **Main risks:** inline CSS loads after shared CSS; duplicated component variable definitions; schedule-specific button specificity; dynamic Gallery states; photo-dependent Story contrast; form focus and status messaging; mobile divider change.
- **Verification:** each interior page at its media-query breakpoints; all registration/link states; Gallery open/next/previous/close/Escape/focus return; Contact keyboard focus and accordion; form fields/error/status; browser console/network; contrast sampling over images.

### Stage 4 — Footer, utilities, cleanup

- **Selectors:** `.site-footer*`, `.skip-link`, global focus utilities, shadows, dormant `.story-page-hero*`, standalone review files only if explicitly in scope.
- **Existing variables/literals:** desktop `#0b2e25`, mobile `--dcpl-green-hover`, footer hover `#e6a5b6`, translucent dividers/text, compatibility aliases, unused variables, old overridden literals.
- **Main risks:** desktop/mobile footer mismatch; deleting fallback declarations still needed by untested states; removing review utilities mistaken for public cleanup; skip-link/focus regression.
- **Verification:** footer at >767 and ≤767px; footer hover/focus contrast; skip-link keyboard test; full selector/runtime coverage; zero unresolved `var()` references; literal-color scan; visual regression across all eight pages before deleting aliases.

## 12. Variables and Declarations to Reassess After Migration

- **KEEP:** provisional palette primitives; `currentColor`; a documented semantic text/surface/border/focus layer.
- **REPLACE DURING MIGRATION:** active green family, old/new red tint families, active blue link/focus pair, Hero/Story/Gallery overlays, footer literals, embedded star color.
- **MERGE:** duplicate white/surface variables; duplicate text/ink, muted, border/line; two shadow systems; redundant page accent declarations.
- **CONVERT TO SEMANTIC TOKEN:** buttons, navigation states, on-dark text, card borders, form borders, overlays, footer roles, focus rings.
- **REMOVE AFTER MIGRATION:** overridden first-root green/lime/cream values; unused `--green-900`, `--green-850`, `--dcpl-surface`; non-winning color rules proven unnecessary by computed-style coverage.
- **INVESTIGATE FURTHER:** `.story-page-hero*`; externally served Google Fonts CSS; unlinked review utilities; dynamic class/state coverage; whether `theme-color` should follow navigation or deep-blue brand surface.

Do not remove compatibility aliases until searches show zero references and browser coverage confirms no JavaScript-created state depends on them. Do not treat static zero-reference counts as sufficient proof when a value may be consumed outside the checked public files.

## 13. Verification Record

Audit-time checks:

- Enumerated all 11 top-level HTML files and classified eight as public based on shared/inbound links; three gallery review utilities have zero inbound links.
- Confirmed every public page loads `style.css`; Gallery additionally loads `gallery.css`; Contact additionally loads `contact.css`.
- Confirmed there are no CSS `@import` rules.
- Located every public inline `<style>` block and the sole inline `style` attribute; the attribute contains no color.
- Searched active external and inline CSS for custom-property definitions, `var()` references, hex, `rgb/rgba`, `hsl/hsla`, named colors, `transparent`, and `currentColor`.
- Calculated definition/reference counts for all color-related variables and exact WCAG ratios for principal opaque pairs.
- Inspected responsive color overrides, high-specificity state rules, and all `!important` declarations.
- Final checksums matched for every file under `website/` and for every pre-existing file under `website-preview/`; no HTML, CSS, JavaScript, image, or asset changed.
- Git `HEAD` remained `80649e1c44a4468853fcca5b3f5b681912a411f3`; no commit was created.
- Final Git status contained only the pre-existing `M website/images/gallery/players.jpg` and the new `?? website-preview/design-token-audit.md`.
- Because all render-affecting preview files are byte-for-byte unchanged and the audit Markdown is not loaded by a public page, rendered appearance is unchanged by this task.
- The pre-existing live-site `players.jpg` modification remained untouched and checksum-identical to the task baseline.
