---
name: ProPOS Modern Admin
colors:
  surface: '#fcf8f9'
  surface-dim: '#dcd9da'
  surface-bright: '#fcf8f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f4'
  surface-container: '#f0edee'
  surface-container-high: '#eae7e8'
  surface-container-highest: '#e5e2e3'
  on-surface: '#1c1b1c'
  on-surface-variant: '#45464c'
  inverse-surface: '#313031'
  inverse-on-surface: '#f3f0f1'
  outline: '#76777c'
  outline-variant: '#c6c6cc'
  surface-tint: '#595e6d'
  primary: '#030612'
  on-primary: '#ffffff'
  primary-container: '#1a1f2c'
  on-primary-container: '#828697'
  inverse-primary: '#c2c6d8'
  secondary: '#8b5000'
  on-secondary: '#ffffff'
  secondary-container: '#ff9800'
  on-secondary-container: '#653900'
  tertiary: '#0b0500'
  on-tertiary: '#ffffff'
  tertiary-container: '#281d0b'
  on-tertiary-container: '#96846b'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dee2f4'
  primary-fixed-dim: '#c2c6d8'
  on-primary-fixed: '#161b28'
  on-primary-fixed-variant: '#424655'
  secondary-fixed: '#ffdcbe'
  secondary-fixed-dim: '#ffb870'
  on-secondary-fixed: '#2c1600'
  on-secondary-fixed-variant: '#693c00'
  tertiary-fixed: '#f5dfc3'
  tertiary-fixed-dim: '#d8c4a8'
  on-tertiary-fixed: '#241a08'
  on-tertiary-fixed-variant: '#534530'
  background: '#fcf8f9'
  on-background: '#1c1b1c'
  surface-variant: '#e5e2e3'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  headline-md-mobile:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  container-margin: 24px
  gutter: 16px
---

## Brand & Style

This design system is built for a high-performance Point of Sale (POS) administrative environment. It prioritizes clarity, efficiency, and professional reliability. The aesthetic follows a **Corporate Modern** style with subtle influences from **Minimalism** to ensure data-heavy screens remain legible and actionable.

The brand personality is authoritative yet accessible, using a deep navy foundation to project stability and vibrant orange accents to highlight critical actions and metrics. The interface is designed to evoke a sense of organized control, reducing cognitive load for managers who need to process sales, inventory, and alerts quickly.

## Colors

The palette is anchored by **Deep Navy (#1a1f2c)** for primary structural elements like the sidebar and headers, providing a high-contrast backdrop for navigation. **Vibrant Orange (#ff9800)** serves as the functional accent, reserved for primary buttons, active states, and critical data points.

To maintain a professional and clean workspace, the main content area uses a **Light Gray background (#f8fafc)**. This reduces eye strain and provides a soft foundation for white card components to pop. Status indicators utilize a soft palette for alerts:
- **Critical/Low Stock:** Soft Red (#ef4444) text on a very pale red background.
- **Warning/Pending:** Amber (#f59e0b) text on a pale amber background.

## Typography

This design system uses **Inter** exclusively to leverage its exceptional legibility in digital interfaces and technical data displays. 

- **Headlines:** Use a tighter letter-spacing and heavier weight to create a strong visual anchor for page titles and card headings.
- **Data Display:** Numerical data in dashboard cards should use `headline-md` for maximum impact.
- **Labels:** Small, uppercase labels are used for table headers and secondary metadata to create clear distinction from interactive body text.

## Layout & Spacing

The design system utilizes a **Fluid Grid** model for the main content area, paired with a **Fixed Sidebar** (260px width). 

- **Grid:** A 12-column grid system is used for dashboard layouts.
- **Rhythm:** All spacing is based on a 4px baseline. Standard card padding is set to `lg` (24px) for desktop and `md` (16px) for mobile.
- **Breakpoints:**
  - **Desktop:** Sidebar visible, 12 columns, 24px margins.
  - **Tablet:** Sidebar collapses to icons or a hamburger menu, 8 columns, 16px margins.
  - **Mobile:** Single column layout, 16px margins, reduced typography scales.

## Elevation & Depth

Visual hierarchy is achieved through **Tonal Layers** and **Ambient Shadows**. The background layer (#f8fafc) sits at the lowest elevation.

- **Cards & Containers:** Pure white (#ffffff) with a 1px border (#e2e8f0) and a soft, diffused shadow: `0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)`.
- **Navigation:** The Sidebar uses color-depth (Deep Navy) rather than shadows to define its boundary.
- **Active States:** Subtle inner shadows or 2px solid orange left-borders are used for active navigation items to denote "depth" within the sidebar.

## Shapes

The design system employs a **Rounded** shape language to soften the professional aesthetic and make the interface feel modern.

- **Standard Elements:** 8px (`0.5rem`) radius for buttons, input fields, and small cards.
- **Large Components:** 16px (`1rem`) radius for main dashboard containers and modal windows.
- **Badges:** Fully pill-shaped (999px) to distinguish status indicators from clickable buttons.

## Components

### Buttons
- **Primary:** Vibrant Orange background, white text, 8px radius. High-emphasis.
- **Secondary:** Deep Navy outline or light gray background with navy text.
- **Ghost:** No background, navy or orange text, used for less frequent actions.

### Status Badges
Used for alerts (Low Stock, Overdue).
- **Critical:** Pale red background, dark red text, bold font-weight.
- **Warning:** Pale amber background, dark amber text, bold font-weight.

### Input Fields
- White background, 1px light gray border, 8px radius. 
- Focus state: 1px Vibrant Orange border with a soft orange outer glow.

### Cards
- White surface, 16px rounded corners, soft ambient shadow. 
- Header section inside cards should have a subtle bottom border or distinct background tint.

### Data Tables
- Row height: 48px to 56px for comfortable legibility.
- Alternating row stripes are not required; use thin 1px horizontal dividers instead.
- Column headers: Uppercase, `label-md` typography.