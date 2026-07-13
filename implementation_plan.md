# API Integration Audit Plan

## Goal
Perform a complete audit of the entire application to fix all API integration issues between the frontend and backend. Ensure all endpoints are correctly connected, HTTP methods match, payloads are correct, and remove any broken or unused calls.

## User Review Required
None so far. I will proceed with the audit and provide a summary of the fixes.

## Open Questions
None.

## Proposed Changes
1. **Audit Backend Routes**: Go through all route files (`admin.js`, `finance.js`, `queues.js`, `sessions.js`, `staff.js`, `patients.js`, etc.) and map out every available endpoint.
2. **Audit Frontend `api.ts`**: Map out every API call defined in `api.ts`.
3. **Compare and Fix**:
    - **Missing Endpoints**: Ensure any endpoint called by the frontend exists in the backend.
    - **Unused Endpoints**: Identify backend endpoints that are not used by the frontend (though they might be used for other purposes, I will focus on making sure frontend calls are valid).
    - **Method Mismatches**: Ensure GET, POST, PUT, DELETE match exactly.
    - **Payload and URL Mismatches**: Ensure URLs are constructed correctly (e.g. `/finance/purchase-requests/${id}/items` vs `/finance/purchase-items/${id}`).
    - **Fix 500 Errors**: Ensure robust error handling and parsing.

## Specific Areas Identified for Investigation:
- Check `api.finance.purchaseRequests.items.update` and `.delete` in `api.ts` - they point to `/finance/purchase-items/${id}`. Does the backend have `/purchase-items/:id` or `/purchase-requests/:request_id/items/:id`?
- Check `api.staff.permissions.getByStaff` vs `staff_dept_permissions` backend route.
- Check `api.backup.local.restore` path vs backend route.

## Verification Plan
1. Compile TypeScript (`tsc --noEmit`) to ensure no syntax or type errors in `api.ts` and `App.tsx`.
2. Ensure the Vite dev server runs without errors.
3. Provide a summary of all fixes made.
