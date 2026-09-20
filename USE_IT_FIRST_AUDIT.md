# Use It First — Implementation Audit

**Audit Date:** September 20, 2026  
**Project Path:** `C:\Users\Yatha\.gemini\antigravity\scratch\use-it-first`  
**Framework:** Next.js 14.2.15 (App Router), React 18, Tailwind CSS, TypeScript  
**Lint Status:** `0 errors`, `0 warnings` (`next lint` passing)  
**Build Status:** `Successful` (26 static and dynamic routes compiled)  
**Dev Server:** Running on `http://localhost:3000` (HTTP 200 across all primary routes)

---

## Executive Summary

Use It First is in a healthy, operational state. The application successfully embodies its core household food-intelligence loop: adding groceries, tracking kitchen pantry items, assessing date/perishability urgency ("Use First"), matching meals to ingredients, logging consumption impact, and predicting restock needs from learned purchase cycles.

The visual foundation aligns with the Warm Editorial (Stitch) design system, multi-user isolation is enforced, and food canonical identities remain distinct without destructive collapsing.

This audit details the architectural structure, traces core user flows, evaluates edge cases, flags real bugs (P1), identifies UI/design inconsistencies (P2), and proposes a concrete implementation roadmap.

---

## 1. Current Architecture

### Architecture Overview
The application currently operates on a **Client-Side State & LocalStorage Persistence Model** wrapped in Next.js App Router:

```text
┌─────────────────────────────────────────────────────────────┐
│                      Next.js App Shell                      │
│   Navbar (Household Switcher) + MobileNav + Footer + Toast  │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│            PantryProvider Context (src/lib/store.tsx)       │
│                                                             │
│  State (Scoped per Active User ID):                         │
│  • items: FoodItem[]               (Pantry Inventory)       │
│  • groceryItems: GroceryItem[]     (Shopping Checklist)     │
│  • purchaseHistory: PurchaseHistoryItem[]                   │
│  • purchaseStats: FoodPurchaseStats[] (Learned Cycles)      │
│  • userProfile: UserProfile        (Size, Diets, Excludes)  │
│  • usageEvents: UsageEvent[]       (Cooked Milestones)      │
│  • dismissedRecIds: string[]       ("Not now" Session State)│
│                                                             │
│  Derived Memoized State:                                    │
│  • recommendations: GroceryRecommendation[] (Levels 1–4)    │
│  • impactMetrics: ImpactMetrics (Rescued kg, Value ₹)       │
│  • recentlyBought / frequentlyBought / dueSoon              │
└──────────────────────────────┬──────────────────────────────┘
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
┌──────────────────────┐              ┌──────────────────────┐
│  Browser Persistence │              │ Canonical Catalogs   │
│  localStorage        │              │ • 310+ Foods         │
│  use_it_first_{uid}_ │              │ • Normalizer Engine  │
│  (100% Isolated)     │              │ • Recipes Data       │
└──────────────────────┘              └──────────────────────┘
```

### Route Map (26 Routes Compiled)
1. `/` — Home (Pantry urgency summary, subtle "For your next shop" card, active shopping list preview, quick actions).
2. `/pantry` — Full pantry inventory (search, tabs: All, Use First, Use Soon, Safe, Opened, Recent; sort: priority, date, name; inline quick-edit; edit drawer; delete).
3. `/priority` — Dedicated "Use First" decision screen partitioned into *USE FIRST*, *USE SOON*, and *SAFE FOR NOW*.
4. `/grocery` — Household shopping checklist (quick add with library autocomplete, recipe-linked tags, duplicate warning banner, recommendations strip with levels & dismissal).
5. `/grocery/library` — Contextual food discovery library (Returning users: *May be due soon* $\rightarrow$ *You buy often* $\rightarrow$ *Recently bought* $\rightarrow$ *Browse all*; New users: *Popular essentials*).
6. `/recipes` — Recipe discovery ranked by pantry matching ratio and priority ingredient rescue score.
7. `/recipes/[slug]` — Recipe detail (ingredients matched vs. missing, 1-click "+ Add missing to grocery list", and "Mark as cooked" pantry deduction).
8. `/impact` — Waste prevention dashboard (items used on time, estimated weight rescued in kg, financial value saved in ₹, visual activity log).
9. `/profile` — Household settings (members count 1–6, dietary preferences, excluded items "Don't suggest" management with one-click restore, demo data reset).
10. `/add` — Gateway route: choose between Photo Scan and Manual Add.
11. `/add/manual` — Single-page item logging with unit steppers, category selection, opened state, and live priority preview.
12. `/scan` — Photo scanning interface with preset kitchen shelf images and file upload.
13. `/scan/results` — Scan candidate review and confirmation screen.
14. `/about` — Editorial product philosophy and methodology.
15. `/404` & `/_not-found` — Branded 404 error page.
16. `/groceries` — Redirect to `/grocery`.
17. API Routes (`/api/pantry`, `/api/impact`, `/api/priority`, `/api/recipes`, `/api/recommendations`, `/api/scan`) — Mock endpoints (see Technical Debt).

---

## 2. Working Features

* [x] **Pantry Management**: Real-time CRUD, status badges, storage locations, best-before tracking, opened date tracking.
* [x] **Urgency Engine (`src/lib/priority.ts`)**: Multi-factor scoring (Date proximity: 60pts, Perishability: 20pts, Opened state: 10pts, Quantity: 10pts).
* [x] **Grocery Checklist**: Check/uncheck items, add with quantity/units, filter by category, clear purchased confirmation.
* [x] **Food Library Experience (`/grocery/library`)**: Distinct views for returning vs. new households, category pills, real-time search.
* [x] **Food Detail Modal (`FoodDetailModal.tsx`)**: Pantry stock cross-check, list duplicate warning, meal ideas pills, stepper controls, permanent exclusion.
* [x] **Non-Collapsing Food Normalization**: 310+ canonical items; preserves qualifiers (Cherry Tomatoes $\ne$ Tomatoes $\ne$ Puree; Curd $\ne$ Greek Yogurt $\ne$ Hung Curd; Paneer $\ne$ Low-Fat Paneer $\ne$ Tofu; Cow Milk $\ne$ Soy Milk $\ne$ Almond Milk $\ne$ Oat Milk).
* [x] **Purchase History & Auto-Learning**: Automatically logs `PurchaseHistoryItem` and recomputes `FoodPurchaseStats` (average cycle interval, average quantity) when items are checked off.
* [x] **4-Level Recommendation Hierarchy**:
  - Level 1 (Need): Running low ($\le 25\%$) or recipe shortfall with `strong` confidence.
  - Level 2 (Due): Cycle $\ge 80\%$ passed with explainable timing (`strong` or `moderate` confidence).
  - Level 3 (Frequent): Regular household staples ($\ge 3$ purchases).
  - Level 4 (Discovery): Popular essentials for new/sparse households (`discovery` confidence).
* [x] **Honest Recommendations**: Zero fake AI percentages; clean, explainable English copy.
* [x] **Negative Filters**: Automatically excludes active grocery items, abundant pantry stock, recent purchases ($< 40\%$ cycle), disliked foods, and session-dismissed items.
* [x] **Session Dismissal ("Not now")**: Hides recommendation cards for the active session without touching profile settings.
* [x] **Permanent Exclusion ("Don't suggest")**: Permanently excludes foods across all recommendations and lists them in `/profile` with a one-click restore option.
* [x] **Recipe $\rightarrow$ Grocery Linking**: Missing ingredients can be added to the shopping list with one click, tagged with recipe name.
* [x] **Cooking $\rightarrow$ Pantry Deduction**: "Mark as cooked" automatically decrements pantry quantities or removes exhausted items, and records `UsageEvent`.
* [x] **Impact Metrics**: Computes rescued weight (kg), value (₹), and meals made directly from usage events.
* [x] **Multi-User Isolation**: Seamless switching between Aarav's Household (User 1) and Priya's Studio (User 2) with 100% isolated storage keys.

---

## 3. Grocery → Pantry Flow

### Flow Walkthrough
1. **User adds item to grocery checklist** (manual quick add, food library, recipe missing ingredient, or recommendation).
2. **User shops and checks the item off** (`toggleGroceryItem(id)`):
   - A `PurchaseHistoryItem` is created.
   - `FoodPurchaseStats` are updated (cycle interval, average quantity).
   - System searches current pantry items for a name or `foodId` match.
   - **Case A — No Duplicate**: An entry is automatically created in pantry (`addItem`) with appropriate default storage (`Fridge`, `Freezer`, or `Cupboard`), and grocery item is marked `checked: true`.
   - **Case B — Duplicate Found**: Returns `duplicateDetected: { groceryItem, existingPantryItem }`. A modal opens asking the user to choose:
     - *Merge*: Adds quantity to existing pantry item.
     - *Separate*: Adds as a new pantry item batch.
3. **Pantry reflects the purchase immediately**, and recommendations recalculate.

### Identified Flaws in Flow
* **[P1] Premature Purchase Logging on Duplicate Cancellation**: In `toggleGroceryItem`, `purchaseHistory` and `purchaseStats` are updated *before* the duplicate resolution choice is made. If the user clicks "Cancel" on the duplicate modal, the grocery item remains unchecked, but purchase count and history were already prematurely mutated and saved to localStorage.
* **[P1] Unit Blindness in Quantity Merging**: In `resolveDuplicate`, choice `'merge'` computes `Number((existingPantryItem.quantity + qtyToAdd).toFixed(1))`. If existing pantry item is `200 g` and grocery item is `1 kg`, it adds $200 + 1 = 201\text{ g}$ instead of converting to $1200\text{ g}$.

---

## 4. Pantry → Recipe → Grocery Flow

### Flow Walkthrough
1. **User views `/recipes`**: Recipes are sorted dynamically:
   - Primary: Number of matching "Use First" or "Use Soon" priority ingredients.
   - Secondary: Overall pantry ingredient coverage ratio.
   - Tertiary: Total cooking time.
2. **User views recipe detail `/recipes/[slug]`**:
   - Compares pantry inventory against recipe ingredients.
   - Highlights in-stock ingredients with priority badges (*Approaching entered date*, *Highly perishable*).
   - Lists missing ingredients with specific quantities.
3. **User clicks "+ Add missing ingredients to grocery list"**:
   - `addMissingIngredientsToGrocery` checks existing checklist items to prevent duplicates.
   - Adds missing items tagged with `source: 'recipe'` and `recipeName`.
4. **User clicks "Mark recipe as cooked"**:
   - `handleMarkCooked` parses amounts and calls `markIngredientsUsed`.
   - Decrements pantry item stock. If quantity hits $\le 0$, removes item from pantry.
   - Logs `UsageEvent` and updates `/impact` rescued statistics.

### Identified Flaws in Flow
* **[P1] Fragile Quantity Parser Fallback**: In `RecipeDetailPage`, `const numMatch = p.amount.match(/(\d+(\.\d+)?)/)`. When the amount is descriptive (e.g. "Pinch of salt", "Few leaves", "To taste"), `numMatch` is null, and the code falls back to `p.pantryQty`. This marks the *entire* pantry stock (e.g., 500g salt) as used in a single meal.

---

## 5. Recommendation System

### Hierarchy & Logic
* **Level 1 — Need** (`score: 90-95`, `confidence: 'strong'`):
  - Trigger 1: Tracked pantry item is nearly empty ($\le 0.3\text{L}$, $\le 300\text{ml}$, $\le 0.3\text{kg}$, $\le 150\text{g}$, $\le 1\text{pcs/pack}$).
  - Trigger 2: Recipe ingredient shortfall for active planned recipes (quantity-aware: recipe need minus pantry stock).
* **Level 2 — Due** (`score: 70-85`, `confidence: 'strong'` if overdue, `'moderate'` if due in 1-2 days):
  - Trigger: Days since last purchase $\ge 80\%$ of normal interval, and pantry is not abundant.
  - Explanations: *"You usually buy this every week."* / *"Usually restocked every ~7 days (due in 1 day)."*
* **Level 3 — Frequent** (`score: 65`, `confidence: 'moderate'`):
  - Trigger: Regular staple with $\ge 3$ recorded purchases, not currently low or due.
* **Level 4 — Discovery** (`score: 45`, `confidence: 'discovery'`):
  - Trigger: New or sparse household ($\le 3$ purchases). Suggests basic essentials (Milk, Tomatoes, Onions, Potatoes, Atta, Oil).

### Filtering & Negative Constraints
* `isExcluded(foodId, name)` enforces:
  - If already on active grocery list $\rightarrow$ skip.
  - If dismissed in current session ("Not now") $\rightarrow$ skip.
  - If in `userProfile.hiddenFoodIds` or `userProfile.dislikedFoods` ("Don't suggest") $\rightarrow$ skip.
  - If current pantry stock is abundant ($> 70\%$ of average purchase quantity) $\rightarrow$ skip.
  - If purchased very recently ($< 40\%$ of cycle interval) $\rightarrow$ skip.

---

## 6. Food Library & Normalization

### Catalog Breadth
* **Total items:** 310+ items in [`src/lib/food-library/food-catalog.ts`](file:///C:/Users/Yatha/.gemini/antigravity/scratch/use-it-first/src/lib/food-library/food-catalog.ts).
* **Categories:** Produce (Vegetables, Leafy Greens, Fruits, Herbs), Dairy & Eggs, Bakery, Grains & Staples, Pulses & Legumes, Spices & Seasonings, Oils & Condiments, Snacks & Nuts, Beverages, Frozen, Breakfast.

### Verification of Distinct Foods (Audit Prompt Item 8)
Tested through direct queries to the normalization engine:
1. `Tomatoes` (`food-tomato`) vs `Cherry Tomatoes` (`food-cherry-tomato`) vs `Tomato Puree / Paste` (`food-tomato-puree`) $\rightarrow$ **Distinct, verified**.
2. `Fresh Curd / Dahi` (`food-curd`) vs `Greek Yogurt` (`food-greek-yogurt`) vs `Hung Curd / Chakka` (`food-hung-curd`) $\rightarrow$ **Distinct, verified**.
3. `Malai Paneer` (`food-paneer`) vs `Low-Fat Paneer` (`food-paneer-lowfat`) vs `Firm Tofu` (`food-tofu`) $\rightarrow$ **Distinct, verified**.
4. `Fresh Cow Milk` (`food-milk-cow`) vs `Soy Milk` (`food-milk-soy`) vs `Almond Milk` (`food-milk-almond`) vs `Oat Milk` (`food-milk-oat`) $\rightarrow$ **Distinct, verified**.

---

## 7. User/Profile/Household Isolation

### Multi-User Implementation
* Controlled by `activeUser` state in `PantryProvider`.
* Pre-configured demo households:
  - `demo-user-001` (**Aarav's Household**): 4 members, vegetarian, established purchase cycles.
  - `demo-user-002` (**Priya's Studio**): 1 member, high protein, fresh pantry, sparse purchase history.
* Storage keys are strictly scoped:
  - `use_it_first_{userId}_items`
  - `use_it_first_{userId}_groceries`
  - `use_it_first_{userId}_history`
  - `use_it_first_{userId}_stats`
  - `use_it_first_{userId}_profile`
  - `use_it_first_{userId}_events`
* Active user ID stored in `use_it_first_active_user_id`.
* Switching users swaps all state in memory and resets session dismissals. No leakage between users.

---

## 8. Data Persistence

* [x] **Pantry items** persist across page navigation and browser reloads.
* [x] **Grocery checklist** persists across page navigation and browser reloads.
* [x] **Purchase history & stats** persist across page navigation and browser reloads.
* [x] **Dietary preferences & excluded items** persist across reloads.
* [x] **Session dismissal ("Not now")** lives in component memory and intentionally resets on page reload or user switch.
* [x] **Baseline reset**: `/profile` includes a one-click reset to restore the active user's original demo baseline.

---

## 9. Mobile & Responsive Audit

Evaluated across screen widths: 360px (small Android), 375px (iPhone SE), 390px (iPhone 14), 768px (iPad/Tablet), 1024px (Laptop), 1280px+ (Desktop).

### Findings
* **Navbar**: Responsive flex layout with household select and quick actions. On desktop, shows full nav links; on mobile, links collapse and defer to `MobileNav`.
* **MobileNav**: Fixed bottom bar (`h-16`) with 6 primary touch targets (Home, Pantry, Use First, Recipes, Groceries, Impact). Badge counters for Use First and Groceries render correctly.
* **[P1] Layout Bottom Padding Missing**: Because `MobileNav` is `fixed bottom-0` (`h-16`, 64px) for screens `< 768px`, and `<main>` in `layout.tsx` lacks bottom padding (`pb-20 md:pb-0`), content or buttons at the bottom of pages (e.g. form submit buttons, table footers, clear buttons) are obscured by the floating nav bar on mobile viewports.
* **Tables / Grids**:
  - Pantry grid switches from 1 column (360px) to 2 columns (768px) to 3 columns (1024px+).
  - Grocery checklist items stack cleanly on mobile.
  - Modals (`FoodDetailModal`, `DuplicateModal`) constrain `max-w-md` with `p-4 sm:p-6` and `max-h-[85vh]` scrollable body.

---

## 10. Accessibility Audit

### Strengths
* Good color contrast across primary text (`#1A1C1E` on `#FAF9FC` $\approx 15:1$).
* Priority tiers always communicate urgency through explicit text labels (*"USE FIRST"*, *"USE SOON"*, *"SAFE FOR NOW"*), never color alone.
* Quick add forms feature `sr-only` labels for screen readers (`<label htmlFor="grocery-name" className="sr-only">`).
* Modal dialogs include `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, and `Escape` key listeners.

### Identified Gaps
* **[P2] Icon-Only Buttons Lacking `aria-label`**:
  - The "Don't suggest" `<Ban />` button on recommendation cards in `grocery/page.tsx` has a `title` attribute but lacks an explicit `aria-label`.
  - The restore `<RotateCcw />` button on excluded tags in `profile/page.tsx` lacks an explicit `aria-label`.

---

## 11. Performance Audit

### Strengths
* Fast page loads: initial JS bundle shared by all routes is small (87.1 kB).
* No external API dependencies during runtime; all recommendations, priorities, and matches execute locally in < 3ms.
* Derived states (`recommendations`, `impactMetrics`, `recentlyBought`) are memoized via `useMemo`.

### Identified Gaps
* **[P2] Un-debounced Search in Food Library**: In `src/app/grocery/library/page.tsx`, typing in the search bar triggers `searchFoodLibrary(searchQuery, FOOD_LIBRARY_CATALOG, 60)` synchronously on every keystroke. While 310 items execute quickly in V8, debouncing (150ms) is best practice to avoid unnecessary render passes.

---

## 12. Error & Empty States

| View | State Tested | Implementation Status | UI Quality |
|---|---|---|---|
| `/pantry` | Empty pantry | Dedicated `EmptyState` component with CTA `+ Add your first food` | Excellent (Matches Stitch spec) |
| `/pantry` | Search no match | `EmptyState` with `Clear Search` button | Excellent |
| `/pantry` | Tab filter empty | `EmptyState` with `View All Items` button | Excellent |
| `/priority` | Tier empty | Inlined informative banners for each tier | Good |
| `/grocery` | No items to buy | Clean empty prompt linking to Food Library & Recipes | Good |
| `/grocery/library` | Search no match | "No matching food found" with keyword advice | Good |
| `/recipes` | Filter no match | `EmptyState` with "Show All Recipes" reset | Good |
| `/impact` | No logs recorded | `EmptyState` with CTA "Browse Recipes to Cook" | Good |
| `/profile` | No excluded items | Informative box explaining how to exclude items | Good |

---

## 13. UI Consistency Audit (Stitch Design System)

The Stitch design system specifies:
- Background: `#FAF9FC`
- Text / Ink: `#1A1C1E`
- Primary Green: `#32533C` (Container: `#4A6B53`, Fixed: `#C7ECCE`)
- Secondary Terracotta: `#97472E` (Fixed: `#FFDBD0`)
- Tertiary Amber: `#664500` (Fixed: `#FFDEAE`)
- Border Radius: Sharp/architectural (`xs: 0.125rem / 2px`, `sm: 0.25rem / 4px`)

### Identified Inconsistencies
* **[P2] Inconsistent Border Radius**:
  - `src/app/grocery/page.tsx` and `src/app/page.tsx` strictly use `rounded-xs` and `rounded-sm`.
  - Newer components (`FoodDetailModal.tsx`, `grocery/library/page.tsx`, `profile/page.tsx`, `priority/page.tsx`, `recipes/page.tsx`) use standard Tailwind `rounded-2xl` and `rounded-xl`.
* **[P2] Legacy Color `#C84B31`**:
  - Hardcoded `#C84B31` is used in `EmptyState.tsx`, `not-found.tsx`, `recipes/page.tsx`, `impact/page.tsx`, and `add/page.tsx` instead of the Stitch semantic token `#97472E` (`secondary.DEFAULT`).
* **[P2] AI Demo Artifact in Scan Results**:
  - `src/app/scan/results/page.tsx` renders `<span>Confidence: {Math.round(item.confidence * 100)}%</span>` (e.g. "Confidence: 94%"). This looks like an AI demo rather than a practical kitchen utility.

---

## 14. Technical Debt

* **[P2] Decoupled Service Layer**:
  - The files in `src/services/` (`pantryService.ts`, `impactService.ts`, `priorityService.ts`, `recipeService.ts`, `scanService.ts`) define standalone classes with outdated hardcoded localStorage keys (`use_it_first_items_v1`).
  - **Zero files** in the application import or use these classes. The entire application runs on `src/lib/store.tsx`.
* **[P2] Redundant / Unconnected API Routes**:
  - `/api/pantry`, `/api/impact`, `/api/priority`, `/api/recipes`, `/api/scan` contain independent in-memory mock datasets that do not reflect or sync with the active user's localStorage state.
* **[P3] Redundant Route `/404/page.tsx`**:
  - Next.js App Router already handles missing routes via `src/app/not-found.tsx`.

---

## 15. Bugs Found

1. **[P1] Duplicate Prompt Premature Mutation**:
   - *Location:* `src/lib/store.tsx` (`toggleGroceryItem`).
   - *Symptom:* Checking an item that matches an existing pantry item records purchase history and recalculates purchase frequency statistics *before* the user accepts or cancels the duplicate resolution modal. If canceled, the purchase is logged anyway.
2. **[P1] Unit Mismatch during Duplicate Quantity Merge**:
   - *Location:* `src/lib/store.tsx` (`resolveDuplicate`).
   - *Symptom:* Merging quantities blindly adds numbers (`existing.quantity + grocery.quantity`) without unit conversion (e.g. $200\text{g} + 1\text{kg} = 201\text{g}$).
3. **[P1] Mobile Layout Bottom Clipping**:
   - *Location:* `src/app/layout.tsx`.
   - *Symptom:* `<main className="flex-1 w-full">` lacks mobile bottom padding (`pb-20 md:pb-0`), causing the fixed `MobileNav` (`h-16`) to cover bottom buttons and forms on screens $< 768\text{px}$.
4. **[P1] Recipe Cooking Full-Stock Deduction on Descriptive Amounts**:
   - *Location:* `src/app/recipes/[slug]/page.tsx` (`handleMarkCooked`).
   - *Symptom:* When an ingredient has a non-numeric amount (e.g. "Pinch of salt", "A few sprigs"), regex returns null, falling back to `p.pantryQty` and wiping out the entire pantry item.

---

## 16. Missing Practical Features

1. **[P2] Editable Household Name on Profile**:
   - Users cannot edit the household name ("Aarav's Household") from `/profile`; it only displays as text.
2. **[P2] Storage Location Filter on Pantry Page**:
   - `/pantry` filters by priority tiers (`USE_FIRST`, `USE_SOON`, `SAFE`) and opened status, but lacks quick filters by storage location (`Fridge`, `Freezer`, `Cupboard`, `Countertop`).
3. **[P2] Camera/OCR Integration for Scanning**:
   - `/scan` currently relies on preset mock images. Real photo capture or receipt scanning is not connected.
4. **[P3] Unit Conversion Utility**:
   - Central helper for converting `kg` $\leftrightarrow$ `g` and `L` $\leftrightarrow$ `ml`.

---

## 17. Recommended Implementation Order

### Phase 1: High-Priority Fixes (P1)
1. **Fix premature purchase mutation in duplicate detection**:
   - In `store.tsx`, defer recording `PurchaseHistoryItem` and updating `FoodPurchaseStats` until duplicate resolution is confirmed (`resolveDuplicate`), or rollback if dismissed.
2. **Implement unit-aware quantity merging**:
   - Add a unit conversion utility for `kg` $\leftrightarrow$ `g` and `L` $\leftrightarrow$ `ml` inside `resolveDuplicate`.
3. **Fix mobile bottom navigation clipping**:
   - Add `pb-20 md:pb-0` to `<main>` in `src/app/layout.tsx`.
4. **Fix recipe ingredient quantity parsing**:
   - Add sensible default deduction (e.g. 5g for pinches/spices, 1 unit for descriptive items) instead of consuming `p.pantryQty`.

### Phase 2: Design & UI Consistency (P2)
5. **Normalize border radii to Stitch standard**:
   - Harmonize `rounded-2xl` / `rounded-xl` in newer views down to `rounded-xs` / `rounded-sm` / `rounded-md` in accordance with `tailwind.config.ts`.
6. **Replace legacy `#C84B31` with Stitch `#97472E`**:
   - Update `EmptyState.tsx`, `not-found.tsx`, and recipe tags.
7. **Remove AI confidence percentages in Scan Results**:
   - Replace "Confidence: 94%" with clean category tags or "Recognized".
8. **Add editable Household Name input to `/profile`**.
9. **Add Storage Location filter pills to `/pantry`**.

### Phase 3: Technical Debt & Polish (P2 / P3)
10. **Clean up or connect `src/services/`**:
    - Either refactor `store.tsx` to use the services or remove the dead code.
11. **Debounce search in Food Library**:
    - Add 150ms debounce to the search input on `/grocery/library`.
12. **Add missing `aria-label` attributes on icon-only buttons**.
