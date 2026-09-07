# Car-Pilot Project Work Memory & Progress Log

**Last Updated:** September 8, 2026
**Backend Staging URL:** `https://car-pilot.onrender.com`
**Frontend Staging URL:** `https://car-pilot-frontend.onrender.com`

---

## 1. Executive Summary

This document records the architectural audit, key bug fixes, and feature implementations completed across both `car-pilot-backend` and `car-pilot` (frontend `apps/web`), aligned strictly with the blueprint defined in `product.md`.

---

## 2. Issues Diagnosed & Resolved

### A. Media & Photos Upload Failure (Fixed End-to-End)
- **Frontend Root Cause**:
  - In `apps/web/src/pages/inventory/AddInventoryPage.tsx`, files selected by the user were only converted into temporary browser `blob:` preview URLs.
  - The form was sending `blob:http://...` directly to the backend without ever transmitting the binary `File` objects. Once the page refreshed, images failed.
  - Furthermore, `apps/web/src/api/inventory.api.ts` lacked an `uploadMedia` method to communicate with the backend's multipart upload endpoint.
- **Frontend Fix**:
  - Added the binary `File` reference to `UploadedMediaItem` in `AddInventoryPage.tsx`.
  - Implemented `inventoryApi.uploadMedia(id, files: File[])` to construct a `FormData` payload sent via `multipart/form-data`.
  - Updated vehicle creation mutation to automatically call `uploadMedia` immediately after the inventory vehicle record is saved.
  - Enabled photo upload functionality directly inside `InventoryDetailPage.tsx`, including an interactive thumbnail carousel and file input trigger.
- **Vite Proxy Fix**:
  - Added `/uploads` proxy to `apps/web/vite.config.ts` targeting `http://localhost:5000` to serve static uploaded media locally without 404s.

### B. Render Staging 500 Proxy Error (Fixed)
- **Root Cause**:
  - The deployed frontend on `https://car-pilot-frontend.onrender.com` was attempting to call relative path `/api/inventory`, which fell back to the Vite dev proxy looking for `localhost:5000` (which does not exist inside Render's frontend container), throwing a 500 error.
- **Fix**:
  - Hardcoded the Render backend staging base URL in `apps/web/src/api/client.ts`:
    `const BASE_URL = 'https://car-pilot.onrender.com/api';`
  - Added `https://car-pilot-frontend.onrender.com` to `CORS_ORIGIN` in backend `src/config/index.ts`.
  - Added `x-forwarded-proto` reverse-proxy SSL detection in `LocalStorageService.getMediaUrl` (`src/storage/localStorage.ts`) so uploaded image URLs on Render generate secure `https://` links.

---

## 3. Core MVP Feature Additions

### A. Meta Ad Engine & Campaign Management
- **`Campaign` Mongoose Model** (`src/models/Campaign.ts`):
  - Tracks `organizationId`, `inventoryItemId`, `name`, `objective` (`MESSAGES`, `LEADS`), `dailyBudget`, `durationDays`, `totalBudget`, `location`, `platforms`, `status`, `metaCampaignId`, `metaAdSetId`, `metaAdId`, and performance `metrics`.
  - Strictly adheres to `product.md` budget safeguards (enforces minimum ?100/day and maximum limits).
- **`CampaignController`** (`src/controllers/campaign.controller.ts`):
  - `GET /api/campaigns`: List campaigns for the active tenant.
  - `GET /api/campaigns/:id`: Retrieve single campaign details.
  - `POST /api/campaigns`: Connects directly to `MetaIntegrationService.promoteReel` (Campaign ? Ad Set ? Creative ? Ad) and persists campaign record.
  - `PATCH /api/campaigns/:id/status`: Pause or resume running campaigns.
- **Registered Routes** (`src/routes/index.ts`):
  - Fully wired with `authenticate` and `requireTenant` middleware.

---

## 4. Current Build & Verification Status

- **Backend (`car-pilot-backend`)**:
  - `npm run typecheck` (`tsc --noEmit`): **Passed with 0 errors**.
- **Frontend (`car-pilot/apps/web`)**:
  - `npm run typecheck` (`tsc --noEmit`): **Passed with 0 errors**.
- **Staging Backend Health**:
  - `GET https://car-pilot.onrender.com/health` returns `{"status":"ok"}`.

---

## 5. Next Pending Tasks (From `product.md`)

1. **Unified Inbox Normalization & BullMQ Queue**:
   - Process incoming Meta webhook messages into `Conversation` and `Message` models.
   - Run AI auto-qualification and human handoff detection.
2. **Follow-Up Engine**:
   - BullMQ delayed sequence workers for follow-ups at 2 hours, next day, and 3 days.
3. **Refactor Controllers into Service / Repository Pattern**:
   - Extract business and MongoDB query logic from controllers into dedicated `services/` and `repositories/`.
