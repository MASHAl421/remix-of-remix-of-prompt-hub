# Light mode

## What will change
- Add a sun/moon switch in the top navigation on desktop and mobile.
- Give Prompt Aura a bright, premium glass palette while preserving the existing dark cinematic palette.
- Remember each visitor’s choice and use their device preference on the first visit.
- Apply the saved theme before the page appears to prevent a distracting color flash.

## Technical details
- Add a small reusable theme control that updates the document theme and browser storage.
- Split the semantic color and glass tokens into light defaults and dark overrides, so existing pages inherit the new mode automatically.
- Verify the homepage in both themes and at desktop and mobile widths.
