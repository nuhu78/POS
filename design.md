# Design System — Gift Shop & Furniture POS

## Color Palette

| Token | Tailwind | Hex | Usage |
|---|---|---|---|
| Primary | `amber-500` | #F59E0B | Brand, buttons, active nav |
| Primary-dark | `amber-700` | #B45309 | Hover states |
| Primary-light | `amber-50` | #FFFBEB | Page backgrounds, table headers |
| Secondary | `teal-600` | #0D9488 | Accent badges, secondary actions |
| Surface | `white` | #FFFFFF | Cards, panels, modals |
| Text-primary | `gray-800` | #1F2937 | Headings, body |
| Text-muted | `gray-500` | #6B7280 | Labels, placeholders |
| Danger | `red-600` | #DC2626 | Delete, errors |
| Success | `green-600` | #16A34A | Stock ok, sale complete |
| Warning | `amber-500` | #F59E0B | Low stock alerts |

## Layout

- **Admin:** sidebar (fixed, w-56) on `lg+`, hamburger drawer on `<lg`.
- **Cashier:** compact top nav bar (no sidebar).
- **Content area:** `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6`.

## Typography

| Element | Classes |
|---|---|
| Page title | `text-2xl font-bold text-gray-800` |
| Section heading | `text-lg font-semibold text-gray-700` |
| Body | `text-sm text-gray-600` |
| Small/caption | `text-xs text-gray-500` |
| Table header | `text-xs font-semibold uppercase text-gray-500` |

## Component Classes (`@layer components` in index.css)

```css
.btn { @apply inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors cursor-pointer disabled:opacity-50; }
.btn-primary { @apply btn bg-amber-500 text-white hover:bg-amber-700; }
.btn-danger { @apply btn bg-red-600 text-white hover:bg-red-700; }
.btn-ghost { @apply btn border border-gray-300 text-gray-700 hover:bg-gray-100; }
.btn-sm { @apply px-3 py-1.5 text-xs; }
.card { @apply rounded-lg border border-gray-200 bg-white p-4 shadow-sm; }
.input { @apply w-full rounded-md border border-gray-300 px-3 py-2 text-sm; }
.input-error { @apply input border-red-500; }
.table-header { @apply text-xs font-semibold uppercase text-gray-500 bg-amber-50; }
```

## Responsive Breakpoints (Tailwind defaults)

| Breakpoint | Width | Behavior |
|---|---|---|
| `sm` | 640px+ | Two-column forms |
| `md` | 768px+ | POS two-panel, sidebar visible |
| `lg` | 1024px+ | Full desktop layout |

## POS Screen

- `md+`: two equal columns — left for product search/grid, right for cart.
- `<md`: stacked — products then cart below. Cashier searches adds, scrolls down to complete sale.
- Product grid uses `gap-2` cards with hover state.
- Cart items show qty input, line total, remove button.

## Invoice Print

- `@media print` hides buttons, nav, sidebar.
- Receipt width constrained to `max-w-sm` with centered alignment.
- Print-specific styles via Tailwind `print:` prefix.

## States

- **Loading:** centered spinner or "Loading..." text in gray.
- **Empty:** muted text "No X found." with centered layout.
- **Error:** `text-red-600` banner above content.
- **Success banner:** `text-green-600` with green background.
