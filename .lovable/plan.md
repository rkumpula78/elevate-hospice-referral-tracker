

## Plan: Offline Support for Elevate Hospice CRM

Given the complexity, this will be split into two phases as the user suggested. Here is Phase A (basic service worker + offline indicator) and Phase B (offline queue + sync).

---

### Phase A: PWA Setup + Offline Indicator

**1. Install `vite-plugin-pwa` and configure `vite.config.ts`**
- Add `vite-plugin-pwa` dependency
- Configure with `generateSW` strategy:
  - Cache-first for static assets (JS, CSS, images, fonts)
  - Network-first (`NetworkFirst`) for Supabase API calls (`qpjdiargpivwtbakkfpo.supabase.co`)
  - `navigateFallbackDenylist: [/^\/~oauth/]` to protect auth redirects
- Register the service worker in `src/main.tsx` using `registerSW` from `virtual:pwa-register`

**2. Create `public/manifest.json`**
- App name: "Elevate Hospice CRM", short_name: "Elevate CRM"
- `theme_color: #0d9488`, `background_color: #ffffff`
- Icons at 192px and 512px (reuse existing logo or generate simple ones)
- `display: standalone`, `start_url: /`

**3. Add PWA meta tags to `index.html`**
- `<link rel="manifest" href="/manifest.json">`
- `<meta name="theme-color" content="#0d9488">`
- Apple touch icon link

**4. Create `src/components/offline/OfflineBanner.tsx`**
- Uses `useState` + `useEffect` listening to `window.addEventListener('online'/'offline')`
- When offline: renders a fixed yellow banner at top: "You are offline. Changes will sync when reconnected."
- When back online: briefly show green "Back online" then auto-dismiss
- Place in `App.tsx` inside the `TooltipProvider`, above the router

---

### Phase B: Offline Queue + Sync

**5. Create `src/lib/offlineQueue.ts`**
- A utility managing a localStorage queue (`elevate-offline-queue`)
- Functions: `addToQueue(action)`, `getQueue()`, `clearQueue()`, `getQueueLength()`
- Each queued item stores: `{ id, table, payload, timestamp, type: 'insert' }`

**6. Modify `QuickNoteSheet.tsx` for offline-aware saving**
- In `saveMutation.onError`, check if `!navigator.onLine`
- If offline, save to offline queue via `addToQueue()` and show toast: "Saved offline. Will sync when reconnected."
- Close the sheet as if successful

**7. Create `src/hooks/useOfflineSync.ts`**
- Listens for `online` event
- When connection returns, reads the queue and replays each insert to Supabase
- On completion, shows toast: "Synced N pending updates"
- Clears processed items from queue
- Called once in `App.tsx`

**8. Add pending sync badge to sidebar**
- In `AppSidebar.tsx`, read queue length from a shared state/context or poll localStorage
- Show a small badge on a "Sync" indicator or near the footer: "3 pending"

**9. Configure TanStack Query for offline caching**
- In `App.tsx` QueryClient config, set default `staleTime` and `gcTime` to longer values
- For organizations list query specifically, set `staleTime: Infinity` when offline (via `networkMode: 'offlineFirst'`)

---

### Files to Create
- `public/manifest.json`
- `src/components/offline/OfflineBanner.tsx`
- `src/lib/offlineQueue.ts`
- `src/hooks/useOfflineSync.ts`

### Files to Modify
- `vite.config.ts` — add vite-plugin-pwa
- `index.html` — manifest link + meta tags
- `src/main.tsx` — register SW
- `src/App.tsx` — add OfflineBanner, useOfflineSync, QueryClient config
- `src/components/mobile/QuickNoteSheet.tsx` — offline-aware save
- `src/components/layout/AppSidebar.tsx` — pending sync badge

### Dependencies to Add
- `vite-plugin-pwa`

