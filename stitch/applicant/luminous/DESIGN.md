---
name: Luminous
colors:
  surface: '#f5faff'
  surface-dim: '#d6dbdf'
  surface-bright: '#f5faff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4f9'
  surface-container: '#eaeef3'
  surface-container-high: '#e4e9ee'
  surface-container-highest: '#dee3e8'
  on-surface: '#171c20'
  on-surface-variant: '#3e484f'
  inverse-surface: '#2c3135'
  inverse-on-surface: '#edf1f6'
  outline: '#6e7980'
  outline-variant: '#bdc8d1'
  surface-tint: '#00668a'
  primary: '#00668a'
  on-primary: '#ffffff'
  primary-container: '#38bdf8'
  on-primary-container: '#004965'
  inverse-primary: '#7bd0ff'
  secondary: '#4648d4'
  on-secondary: '#ffffff'
  secondary-container: '#6063ee'
  on-secondary-container: '#fffbff'
  tertiary: '#855300'
  on-tertiary: '#ffffff'
  tertiary-container: '#f1a02b'
  on-tertiary-container: '#613b00'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#c4e7ff'
  primary-fixed-dim: '#7bd0ff'
  on-primary-fixed: '#001e2c'
  on-primary-fixed-variant: '#004c69'
  secondary-fixed: '#e1e0ff'
  secondary-fixed-dim: '#c0c1ff'
  on-secondary-fixed: '#07006c'
  on-secondary-fixed-variant: '#2f2ebe'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb960'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#f5faff'
  on-background: '#171c20'
  surface-variant: '#dee3e8'
typography:
  display:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: 0.01em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  xs: 8px
  sm: 16px
  md: 24px
  lg: 40px
  xl: 64px
  gutter: 24px
  margin: 32px
---

## Brand & Style

This design system is defined by a sense of weightlessness and clarity. It avoids the heavy shadows and stark contrasts of traditional "dark mode" or "neon" tech aesthetics, opting instead for a serene, high-fidelity atmosphere. The visual language is centered around **Glassmorphism** and **Minimalism**, creating an environment that feels like a clear morning sky.

The target experience is sophisticated and professional, evoking an emotional response of calm focus and premium quality. Every element is designed to feel like a physical layer of polished glass suspended in a soft, ethereal light.

## Colors

The palette revolves around a core "Sky-to-Indigo" gradient used exclusively for primary actions and brand accents. 

- **Background:** A mesh aura using soft sky-blue tints to create depth without visual noise.
- **Surfaces:** Translucent white (`rgba(255, 255, 255, 0.6)`) acts as the canvas for all content containers.
- **Typography:** Deep Indigo or Dark Slate is used to ensure high legibility against translucent backgrounds. 
- **Accents:** Use the Sky-400 to Indigo-500 gradient sparingly to draw attention to the most important conversion points or active states.

## Typography

This design system utilizes **Inter** for its systematic, utilitarian precision, which balances the ethereal nature of the glass surfaces. 

- **Headlines:** Use tight tracking and semi-bold weights to ground the design.
- **Body Text:** Use Slate-800 for primary reading and Indigo-900 for emphasis.
- **Scale:** High-fidelity layouts should prioritize generous line heights to maintain the "airy" feel.
- **Color:** Avoid pure black; use the dark slate/indigo tones defined in the color section to maintain the sophisticated palette.

## Layout & Spacing

The layout model is a **Fluid Grid** that emphasizes negative space. Elements are organized on a 12-column grid with generous margins to prevent the interface from feeling cluttered.

- **Rhythm:** A base 4px/8px unit scale is used for all internal padding.
- **Margins:** External page margins are intentionally wide (32px minimum) to reinforce the airy aesthetic.
- **Alignment:** Content is typically center-aligned or aligned to the soft edges of the glass containers, ensuring a balanced, structured composition despite the soft background.

## Elevation & Depth

Depth is conveyed through **Glassmorphism** rather than traditional opaque stacking. 

- **Backdrop Blur:** All surfaces must implement a significant backdrop blur (minimum 20px) to ensure content remains legible over the mesh gradient background.
- **Shadows:** Use extra-diffused, low-opacity shadows. Shadows should be tinted with a hint of Indigo (#6366F1) at 5-10% opacity to feel natural within the light environment.
- **Layering:** When stacking glass surfaces, the "top" layer should have a slightly higher white opacity (0.7) and a subtle 1px white inside-stroke (border) to simulate the edge of a glass pane.

## Shapes

The shape language is consistently **Rounded**, reflecting a soft and approachable professional tone.

- **Base Components:** 0.5rem (8px) border radius for standard inputs and small buttons.
- **Containers/Cards:** 1rem (16px) border radius for primary surface containers.
- **Large Sections:** 1.5rem (24px) border radius for modal dialogs or hero content areas.
- **Borders:** Surfaces use a very thin (1px) semi-transparent white border to define the shape against the blurred background.

## Components

### Buttons
- **Primary:** Filled with the Sky-400 to Indigo-500 gradient. Text is white with a slight drop shadow for legibility.
- **Secondary:** A glassmorphic white button with a subtle indigo border and indigo text.
- **Hover States:** Increase the backdrop blur or slightly shift the gradient brightness.

### Cards & Surfaces
- Surfaces are `rgba(255, 255, 255, 0.6)` with a `backdrop-filter: blur(24px)`.
- Include a 1px white border at 30% opacity for a "crisp edge" effect.

### Input Fields
- Inputs are translucent white with a softer blur (12px).
- Focus states should use a 2px glow or border using the Sky-400 brand color.

### Chips & Badges
- Small, pill-shaped elements using high-transparency indigo backgrounds or the brand gradient at 10% opacity for a subtle "tint" effect.

### Selection Controls
- Checkboxes and Radios use the Indigo-500 color when active.
- Switches utilize a glassmorphic track with a gradient-filled thumb.