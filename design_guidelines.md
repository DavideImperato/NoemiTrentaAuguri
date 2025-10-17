# Design Guidelines: Noemi30Cam - Birthday Photo Booth

## Design Approach
**Reference-Based: Instagram/Snapchat Camera Interface** - Taking inspiration from popular camera apps with overlay filters and instant sharing capabilities, adapted for a celebratory birthday context with elegant pastel aesthetics.

## Core Design Elements

### A. Color Palette

**Primary Colors (User-Specified):**
- Rose Pink (Background/Accents): 350 65% 89% - #f7c8d0
- Light Gold (Highlights/Decorative): 48 83% 91% - #f9e79f
- Pure White (Text/Cards): 0 0% 100%

**Supporting Colors:**
- Soft Peach (Warm accents): 25 80% 85%
- Lavender Blush (Subtle backgrounds): 340 40% 95%
- Deep Rose (CTAs/Important text): 350 70% 60%
- Gold Metallic (30th celebration emphasis): 45 90% 70%

**Dark Mode:** Not required for this single-use party application

### B. Typography

**Font Families:**
- Primary (Headings): "Great Vibes" - elegant script for "Buon 30° Compleanno Noemi!" and decorative elements
- Secondary (Body/UI): "Poppins" - clean, modern sans-serif for buttons, instructions, messages

**Type Scale:**
- Hero Heading: text-6xl md:text-8xl (Great Vibes) - main birthday message
- Subheading: text-2xl md:text-3xl (Poppins Medium) - instructions
- Button Text: text-lg (Poppins SemiBold) - camera button, confirmations
- Body: text-base (Poppins Regular) - general instructions
- Small/Footer: text-sm (Poppins Light) - "Creato con amore" message

### C. Layout System

**Spacing Primitives:** Tailwind units of 4, 6, 8, 12, 16 for consistent vertical rhythm
- Component padding: p-6 to p-8
- Section spacing: py-12 to py-16
- Button spacing: px-8 py-4
- Card margins: mb-8

**Layout Structure:**
- Mobile-first, centered, single-column design
- Maximum width: max-w-2xl for content containment
- Full-width camera preview: w-full with rounded corners
- Centered elements: flex flex-col items-center justify-center

### D. Component Library

**Hero Section:**
- Full-viewport centered welcome screen
- Large "Buon 30° Compleanno Noemi!" in Great Vibes
- Subtle animated floating balloons background (CSS keyframes)
- Pastel gradient background blending rose pink and light gold

**Camera Interface:**
- Large "📸 Scatta una Foto" button with deep rose background
- Live video preview with rounded-3xl border
- Overlay frame preview showing decorative border
- Real-time camera feed: aspect-video, object-cover

**Photo Preview Card:**
- Captured image with applied birthday frame overlay
- White card background with shadow-2xl
- Display timestamp and success message
- Subtle bounce-in animation on capture

**Confirmation Messages:**
- Success toast: "✅ Foto salvata nel Drive del compleanno di Noemi!"
- Soft green background (140 60% 90%) with checkmark
- Fade-in animation from top
- Auto-dismiss after 4 seconds

**Footer:**
- Sticky bottom positioning
- "Creato con amore per Noemi 💖 da Davide" in Poppins Light
- Soft rose pink background with white text
- Small text-sm size, centered

### E. Interactive Elements

**Buttons:**
- Primary (Camera): Deep rose background, white text, rounded-full, px-8 py-4, shadow-lg
- Hover: Slightly darker rose with scale-105 transform
- Active: scale-95 with deeper shadow

**Camera States:**
- Loading: Pulsing animation on button
- Active: Blue ring around video preview
- Captured: Success checkmark overlay

**Animations (Minimal):**
- Hero text: Gentle fade-in on load
- Button: Subtle pulse on hover
- Photo capture: Quick flash effect (white overlay 200ms)
- Toast messages: Slide-in from top
- Floating balloons: Slow upward drift (optional decorative)

## Images & Decorative Elements

**Frame Overlay (cornice_noemi.png):**
- PNG with transparent background
- Decorative border featuring:
  - Pink and gold balloons in corners
  - Large golden "30" at top center
  - Scattered stars and hearts around edges
  - Elegant ribbon or banner motif
  - Pastel color scheme matching overall design
- Applied as CSS overlay using Canvas API for photo composition

**Background Decorations:**
- Subtle confetti pattern (CSS or SVG) in rose and gold
- Soft bokeh light effects (optional)
- No heavy imagery that competes with camera interface

## Mobile Optimization

**Touch Targets:**
- Minimum 48px height for all interactive elements
- Camera button: Large 64px height minimum
- Adequate spacing between interactive elements (min 12px)

**Responsive Breakpoints:**
- Mobile (base): Single column, full-width camera
- Tablet (md:): Slightly constrained width, larger text
- Desktop: Centered layout, max-w-2xl container

**Performance:**
- Lazy load Google Drive API scripts
- Optimize frame overlay PNG (max 500KB)
- Use transform for animations (hardware accelerated)
- Preload fonts for instant rendering

## Accessibility

- High contrast text (white on deep rose for buttons)
- Clear instructions before camera activation
- Success/error states clearly communicated
- Keyboard navigation not critical (touch-first party app)
- Camera permission handling with clear messaging

## Party Context Considerations

- One-tap camera activation (minimal friction)
- Instant visual feedback on photo capture
- Clear confirmation of successful save
- Optimized for varying lighting conditions at party venue
- Works in portrait orientation (natural phone holding)
- No login required before first interaction (OAuth only when saving)