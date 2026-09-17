---
name: Luminous Sky
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#3e484f'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#6e7980'
  outline-variant: '#bdc8d1'
  surface-tint: '#00668a'
  primary: '#00668a'
  on-primary: '#ffffff'
  primary-container: '#38bdf8'
  on-primary-container: '#004965'
  inverse-primary: '#7bd0ff'
  secondary: '#6b38d4'
  on-secondary: '#ffffff'
  secondary-container: '#8455ef'
  on-secondary-container: '#fffbff'
  tertiary: '#5c5f61'
  on-tertiary: '#ffffff'
  tertiary-container: '#afb2b4'
  on-tertiary-container: '#414546'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#c4e7ff'
  primary-fixed-dim: '#7bd0ff'
  on-primary-fixed: '#001e2c'
  on-primary-fixed-variant: '#004c69'
  secondary-fixed: '#e9ddff'
  secondary-fixed-dim: '#d0bcff'
  on-secondary-fixed: '#23005c'
  on-secondary-fixed-variant: '#5516be'
  tertiary-fixed: '#e0e3e5'
  tertiary-fixed-dim: '#c4c7c9'
  on-tertiary-fixed: '#191c1e'
  on-tertiary-fixed-variant: '#444749'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  h1:
    fontFamily: Space Grotesk
    fontSize: 4.5rem
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.04em
  h2:
    fontFamily: Space Grotesk
    fontSize: 3rem
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.04em
  h3:
    fontFamily: Space Grotesk
    fontSize: 2rem
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.03em
  body-lg:
    fontFamily: Inter
    fontSize: 1.125rem
    fontWeight: '400'
    lineHeight: '1.7'
    letterSpacing: 0.01em
  body-md:
    fontFamily: Inter
    fontSize: 1rem
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: 0px
  label-sm:
    fontFamily: Space Grotesk
    fontSize: 0.75rem
    fontWeight: '500'
    lineHeight: '1'
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1440px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 64px
---

## Brand & Style

The brand personality is ethereal, transcendent, and technologically advanced. This design system evokes a sense of infinite horizon and clarity, positioning the product as a guiding light within a complex digital "void." The UI should feel like a physical layer of polished crystal suspended within a vibrant atmosphere.

The design style is a sophisticated blend of **Minimalism** and **Glassmorphism**. It prioritizes high-key aesthetics where negative space is not merely empty but filled with a "living" light (the Aura). The interface focuses on the interplay of light refraction and depth, moving away from flat surfaces toward a more tactile, liquid experience.

## Colors

The palette is anchored by the **Void**, a near-white foundation that provides a sense of boundless space. The **Core** consists of high-energy gradients transitioning from Sky-400 to Violet-500, used sparingly to indicate intelligence and primary actions. 

The **Aura** is the defining characteristic of this design system; it is an organic, moving mesh gradient applied to the background level. It should never be static. Subtle shifts in the Aura’s opacity and position create a "breathing" effect, ensuring the UI feels alive. Use the secondary and tertiary colors for semantic meaning and support text, keeping the overall contrast high against the Void.

## Typography

Typography in this design system balances technical precision with high-fashion editorial flair. Headers utilize **Space Grotesk** with aggressive negative letter-spacing and heavy weights to create a "dense" visual anchor against the airy background.

Body text is set in **Inter**, chosen for its utilitarian clarity and "airy" feel. Increase line height on body copy to ensure a breathable reading experience. Labels and small metadata should return to Space Grotesk, often in uppercase with wide tracking, to maintain the futuristic, geometric aesthetic across all scales.

## Layout & Spacing

This design system uses a **Fixed Grid** approach for primary content containers to maintain a sense of structured "islands" within the atmospheric background. Use a 12-column grid with generous 64px margins on desktop to push content toward the center, enhancing the "floating" sensation.

Spacing follows an 8px atomic scale, but emphasizes "white space as a material." Layouts should avoid overcrowding; favor large paddings (48px+) within glass containers to emphasize the refraction effects and transparency at the edges.

## Elevation & Depth

Depth is not communicated through traditional shadows, but through **Layered Glassmorphism**. 

1.  **Inner Glow (Rim Lighting):** Every glass container must have a 1px semi-transparent white border with an "inner" shadow (0px blur, 1px spread) to simulate light catching the edge of a crystal.
2.  **Backlight:** Instead of black shadows, use "diffused glows." When a component is active or elevated, apply a drop shadow using the Core colors (Sky or Violet) with a very high blur radius (40px+) and low opacity (15-20%).
3.  **Refraction:** Background blurs should be significant (20px to 40px) to ensure text legibility over the moving Aura mesh.

## Shapes

The shape language centers on softened geometric forms. While the base roundedness is set to **2 (Rounded)** for standard cards and containers, navigation elements and interactive "Orbs" should utilize maximum corner radii (pill-shaped).

Avoid sharp 90-degree angles entirely, as they break the liquid, atmospheric metaphor. The interplay between large-radius containers and high-precision typography creates the "Futuristic" tension required by this design system.

## Components

### Floating Command Hub (Sidebar)
The sidebar is not docked; it is a "suspended glass pillar." It should sit 24px away from the screen edge with a high backdrop-blur. The active state within the hub should use the Core gradient for icons or indicators, paired with a subtle "Backlight" glow.

### Orb Navigation (Mobile)
A floating, circular navigation trigger at the bottom center. When tapped, it expands using a liquid animation into a glass-morphic menu. The "Orb" itself should have a persistent 2px vertical drift animation.

### Cards & Surfaces
All cards utilize the "floating" material logic. Apply a constant, slow-motion 2px vertical drift (y-axis translation). On hover, the drift stops and the Inner Glow (rim light) increases in brightness.

### Buttons
Primary buttons are solid Core gradients with white text. Secondary buttons are "Ghost Glass"—transparent with a 1px rim light and a subtle backlight on hover. 

### Input Fields
Inputs are minimal glass strips. The "Inner Glow" remains subtle until focus, at which point the border glows with the Core Sky-400 color and the liquid transition expands the underline.