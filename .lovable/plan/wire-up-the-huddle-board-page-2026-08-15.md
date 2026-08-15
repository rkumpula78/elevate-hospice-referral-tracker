# Wire up the Huddle Board page

## Changes

**src/App.tsx**
- Add `import HuddleBoard from "./pages/HuddleBoard";` with the other page imports.
- Add `<Route path="huddle" element={<HuddleBoard />} />` immediately after the `weekly-activity` route inside `ProtectedLayout`.

**src/components/layout/AppSidebar.tsx**
- Add `Users` to the existing `lucide-react` import.
- Add `{ title: "Huddle", url: "/huddle", icon: Users },` to `primaryItems`, after the "BD Dashboard" entry.

## Supabase types

No action needed. The generated types file already contains the new objects — `activities`, `huddle_meetings`, `huddle_items`, the `v_huddle_*` views, and `fn_huddle_open_meeting` are all present, so it is already in sync with the applied migrations. No database changes will be made.

## Scope

Nothing else is touched — `HuddleBoard.tsx` itself is left exactly as written.
