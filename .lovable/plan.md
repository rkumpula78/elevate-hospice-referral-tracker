

## Plan: Integrate OpenClaw Elevate Ops Chatbot

### What We're Building
A floating chat widget ("Elevate Ops") available on all CRM pages, powered by the OpenClaw gateway. It will be context-aware — when viewing a referral, patient, or organization, the bot automatically gets that context.

### Security Fixes to the Uploaded Code
The uploaded edge function has **hardcoded credentials** (API token and gateway URL). These must be moved to Supabase secrets. The function also lacks JWT authentication, which is required per HIPAA compliance standards.

### Steps

**1. Store OpenClaw credentials as Supabase secrets**
- Add `OPENCLAW_GATEWAY_URL` secret (`http://178.156.236.80:18789`)
- Add `OPENCLAW_API_TOKEN` secret (the token from the uploaded file)
- Never hardcode these in source code

**2. Create `elevate-ops-chat` edge function**
- Based on the uploaded `index.ts` but with:
  - Credentials read from `Deno.env.get()` instead of hardcoded
  - JWT verification via `supabase.auth.getUser()`
  - Input validation (messages array, length limits)
  - PHI sanitization on any context data sent to the external API
  - CORS headers matching project standard
- Register in `supabase/config.toml` with `verify_jwt = false` (manual verification in code per project pattern)

**3. Create `ElevateOpsChat` floating widget component**
- Floating bubble (bottom-right) on all authenticated pages
- Opens a chat panel with:
  - Message history (local state, not persisted — avoids PHI storage concerns)
  - Markdown rendering via `react-markdown`
  - Loading/typing indicator
  - Clear conversation button
- Context injection: reads current route to detect if on a referral/patient/org detail page, passes non-PHI context (status, org name, role) to the edge function
- Uses `supabase.functions.invoke('elevate-ops-chat', ...)` for API calls

**4. Mount widget in `ProtectedLayout`**
- Add `<ElevateOpsChat />` alongside the existing `<MobileFAB />` in `App.tsx`'s `ProtectedLayout`

### Technical Details

**Edge function request shape:**
```json
{
  "messages": [{"role": "user", "content": "..."}],
  "context": { "currentPage": "referral", "status": "new_referral" }
}
```

**PHI protection:** Context sent to OpenClaw will only include non-identifying data (status, org type, page type). Patient names, diagnoses, addresses, and other PHI will be excluded from the context payload.

**Component placement:** The widget renders as a fixed-position element, so it won't interfere with the existing sidebar or MobileFAB layout. On mobile, it will stack above the FAB.

### Files Changed/Created
- `supabase/functions/elevate-ops-chat/index.ts` — new edge function
- `supabase/config.toml` — add function config
- `src/components/chat/ElevateOpsChat.tsx` — new floating chat widget
- `src/App.tsx` — mount the widget in ProtectedLayout

