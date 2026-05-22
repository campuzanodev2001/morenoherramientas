---
name: Industrial Neo-Brutalism
colors:
  surface: '#fcf9f8'
  surface-dim: '#dcd9d9'
  surface-bright: '#fcf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f2'
  surface-container: '#f0edec'
  surface-container-high: '#ebe7e7'
  surface-container-highest: '#e5e2e1'
  on-surface: '#1c1b1b'
  on-surface-variant: '#454650'
  inverse-surface: '#313030'
  inverse-on-surface: '#f3f0ef'
  outline: '#767681'
  outline-variant: '#c6c5d2'
  surface-tint: '#4c5a9d'
  primary: '#001256'
  on-primary: '#ffffff'
  primary-container: '#1b2a6b'
  on-primary-container: '#8694db'
  inverse-primary: '#b9c3ff'
  secondary: '#b81021'
  on-secondary: '#ffffff'
  secondary-container: '#dc3036'
  on-secondary-container: '#fffbff'
  tertiary: '#331100'
  on-tertiary: '#ffffff'
  tertiary-container: '#542100'
  on-tertiary-container: '#d2855b'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dde1ff'
  primary-fixed-dim: '#b9c3ff'
  on-primary-fixed: '#001257'
  on-primary-fixed-variant: '#344283'
  secondary-fixed: '#ffdad7'
  secondary-fixed-dim: '#ffb3ae'
  on-secondary-fixed: '#410004'
  on-secondary-fixed-variant: '#930014'
  tertiary-fixed: '#ffdbca'
  tertiary-fixed-dim: '#ffb68f'
  on-tertiary-fixed: '#331100'
  on-tertiary-fixed-variant: '#713713'
  background: '#fcf9f8'
  on-background: '#1c1b1b'
  surface-variant: '#e5e2e1'
  surface-dark: '#111111'
  on-surface-dark: '#FFFFFF'
  accent-red: '#C8202A'
  border-primary: '#1B2A6B'
typography:
  display-lg:
    fontFamily: Poppins
    fontSize: 48px
    fontWeight: '900'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Poppins
    fontSize: 36px
    fontWeight: '900'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Poppins
    fontSize: 32px
    fontWeight: '800'
    lineHeight: 36px
  headline-md:
    fontFamily: Poppins
    fontSize: 24px
    fontWeight: '800'
    lineHeight: 32px
  body-lg:
    fontFamily: Poppins
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Poppins
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Poppins
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
  price-lg:
    fontFamily: Poppins
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 32px
spacing:
  margin-mobile: 16px
  margin-desktop: 64px
  gutter: 24px
  unit: 8px
  section-gap: 32px
  container-max: 1280px
---

## Brand & Style
This design system embodies a high-impact, industrial aesthetic tailored for heavy-duty tools and hardware. It combines **Neo-Brutalist** elements—such as sharp 90-degree corners, heavy black borders, and high-contrast "hard" shadows—with a professional corporate color palette. 

The brand personality is authoritative, rugged, and precise. It avoids softness and decorative flourishes in favor of raw utility and urgency. Visual hierarchy is established through massive, all-caps typography and aggressive color blocking, evoking the feeling of a modern industrial warehouse or professional workshop.

## Colors
The palette is built on a triad of power: **Industrial Navy** (#1B2A6B) for structure, **Safety Red** (#C8202A) for action and urgency, and **Carbon Black** (#111111) for depth. 

- **Primary (Navy):** Used for structural headers and primary borders.
- **Secondary (Red):** Reserved for high-priority CTAs, price points, and "active" indicators.
- **Neutral:** A stark white background is contrasted by deep Carbon Black containers for product displays and categories, creating a "dark mode" feel within a light mode framework.
- **Functional:** Use high-contrast white text on dark backgrounds to maintain readability and impact.

## Typography
The system uses **Poppins** exclusively to leverage its geometric purity and wide weight range. 

- **Headlines:** Use ExtraBold (800) or Black (900) weights. All primary section headers and hero text must be **uppercase** with tight tracking to mimic industrial signage.
- **Prices:** Prominent and clear, utilizing the boldest weight and the secondary red color.
- **Labels:** Uppercase with increased letter spacing for navigation and technical specs.
- **Hierarchy:** Contrast is achieved through weight and case transformations rather than just font size changes.

## Layout & Spacing
The layout follows a **Fixed-Width Mobile-First** approach (optimized for 390px) that scales to a structured grid on desktop.

- **Rhythm:** An 8px base unit (unit) drives all spacing. 
- **Sections:** Large 32px vertical gaps separate distinct content blocks.
- **Margins:** 16px horizontal safe-zones for mobile.
- **Structural Borders:** Use 2px to 4px solid borders instead of subtle dividers to reinforce the brutalist framework.

## Elevation & Depth
This system rejects soft shadows and ambient light. Depth is communicated through:

1.  **Hard Shadows:** Elements use high-opacity, non-blurred offsets (e.g., `4px 4px 0px 0px rgba(0,0,0,0.2)`) to create a "lifted" effect.
2.  **Color Inversion:** Deep black containers (#111111) set against light surfaces create immediate focus.
3.  **Borders as Depth:** Thick, 4px colored borders (especially in secondary red) denote focus and selection during hover states.
4.  **Overlays:** Semi-transparent primary navy overlays (60% opacity) on images for text legibility.

## Shapes
The shape language is strictly **Sharp (0px)**. 

Every component—from buttons and inputs to category cards and product images—must have 0px border radius. The only exception is the `full` utility used for circular icons or specific UI toggles if necessary. This lack of rounding reinforces the "industrial" and "unyielding" nature of the brand.

## Components
- **Buttons:** Large, blocky, and uppercase. Primary CTAs use the Secondary Red background with a hard shadow. Secondary buttons use a thick 2px navy border with no fill.
- **Inputs:** White background, 2px navy border, and 0px radius. Focus state shifts the border to Secondary Red.
- **Category Cards:** Aspect-ratio square, #111111 background, uppercase labels. Hover states should trigger a 1px Red border.
- **Product Lists:** Horizontal layout with grayscale-to-color image transitions on hover. Use 4px left-border accents to indicate selection or focus.
- **Badges/Chips:** Rectangular, sharp edges, high-contrast text.
- **Header/Footer:** The header is anchored by a 2px bottom border in Primary Navy; the footer is anchored by a 4px top border in Secondary Red.