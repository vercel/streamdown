---
"streamdown": patch
---

fix: Escape now closes the fullscreen table, fullscreen Mermaid diagram and link safety modal when focus is on a control inside them. When a copy/download menu is open, Escape closes only the menu and returns focus to its trigger; a second Escape closes the overlay.
