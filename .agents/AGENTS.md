# PatchPulse Customization Rules

## Premium UI/UX Design System Rules

All agents working on frontend UI must STRICTLY adhere to the following design system parameters:

1. **THEME & APP SHELL**:
   - The application must support both Dark Mode and Light Mode variants using semantic CSS variables mapped in Tailwind.
   - Use absolute positioning layers for glowing radial background blurs.

2. **TACTILE NEOMORPHISM & GLASSMORPHISM**:
   - Cards & Overlays MUST use: `backdrop-blur-xl bg-white/10 border border-white/20`.
   - Apply deep, layered drop shadows to separate UI panels from the map/background: `shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]`.

3. **MICRO-INTERACTIONS**:
   - Elements must feel tactile. Every clickable button, card, or navigation icon MUST include Tailwind transitions: `transition-all duration-200 active:scale-95 hover:scale-[1.02]`.

4. **URBAN MAP CONTROLS**:
   - Map overlay panels must float cleanly over the map canvas. Use rounded corners (`rounded-3xl`) and explicit margins (`m-4` or similar) from the edge of the screen so they never look pinned, docked, or crammed.
