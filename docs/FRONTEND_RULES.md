# KrishiSetu Frontend Development Rules

## 1. SOURCE OF TRUTH

The frontend tracking files inside /docs are the project memory.

Never rely only on conversation memory.

---

## 2. STEP ORDER

Do not randomly jump between pages.

Follow FRONTEND_ROADMAP.md.

If a dependency is missing, build the dependency first.

---

## 3. EXISTING CODE

Before creating a new component:

Check whether an existing reusable component can be used.

Do not create duplicate:

- Button
- Card
- Input
- Badge
- Alert
- Spinner
- Modal
- Navbar
- Layout

components unnecessarily.

---

## 4. EXISTING FILE MODIFICATION

When modifying an existing file:

Provide the complete updated file.

Do not silently replace only a small section.

---

## 5. DESIGN SYSTEM

Use the existing KrishiSetu visual language.

Do not randomly introduce unrelated colours, shadows, border styles or typography.

---

## 6. FARMER UX

Farmer-facing screens must prioritize:

- readability
- simplicity
- speed
- accessibility
- mobile usability

---

## 7. 3D

3D is enhancement, not a dependency for critical functionality.

Never make:

- booking
- forms
- queue information
- payment information
- status tracking

dependent on 3D rendering.

Every important 3D section should have a lightweight fallback.

---

## 8. PERFORMANCE

Prefer:

- simple geometry
- lazy loading
- lightweight assets
- limited lights
- limited shadows
- responsive rendering
- reduced motion support

Avoid unnecessary large 3D models.

---

## 9. API

Do not hardcode API URLs inside pages.

Use the centralized API client.

Expected API base:

VITE_API_URL

---

## 10. BACKEND CONTRACT

Do not invent backend response fields when integrating.

If the real Swagger/API contract differs:

Update the frontend according to the real contract.

---

## 11. MOCK DATA

If backend functionality is not ready:

Use clean mock data/services.

Keep mock logic separate so it can later be replaced by API calls.

---

## 12. TESTING

Every completed step must be tested in the browser.

Check:

- normal state
- loading state
- error state where relevant
- empty state where relevant
- mobile layout
- desktop layout

---

## 13. TRACKING

After every completed step:

Update:

FRONTEND_STATE.md

and:

FRONTEND_CHANGELOG.md

---

## 14. NEVER DECLARE SOMETHING COMPLETE WITHOUT TESTING

Folder created != feature complete.

File created != feature complete.

UI visible != feature necessarily complete.

The feature is complete only after testing and tracking.