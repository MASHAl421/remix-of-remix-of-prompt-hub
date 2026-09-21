# AI-assisted master prompt submission

## Goal
Add an optional AI assistant to the existing master-prompt form. Contributors can paste a prompt, ask AI to analyze it, then review and edit the suggestions before submitting.

## What will change
- Add an **Analyze with AI** action beside the master-prompt fields.
- Send the title, prompt text, and optional competitor-link context securely through a server function to Lovable AI Gateway.
- Return one existing niche category, up to 10 searchable tags, and a short checklist of missing or unclear details.
- Apply the suggested category and tags to the form only when the contributor chooses; never publish or submit automatically.
- Show clear loading, success, and retry states. If AI is unavailable, manual submission continues to work unchanged.
- Validate all browser input and AI output, limit analysis payload size safely, and keep the AI credential server-only.

## Technical details
- Create a client-safe `*.functions.ts` server-function module with Zod input/output validation.
- Use the existing `CATEGORIES` list as the only allowed classification values.
- Keep anonymous submissions pending for admin approval and preserve mandatory image plus optional competitor links.
- Reuse the existing design system controls and semantic styles.

## Verification
- Run the TypeScript check and inspect current build diagnostics.
- Test AI suggestions, manual edits after suggestions, normal submission, failure fallback, and mobile layout in the preview.
