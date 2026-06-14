You are Codex working inside my POS System repository.

CONTEXT:
This project is a portfolio-grade POS System, not a simple cashier CRUD app.

Current business modes:

1. Restaurant / F&B mode: already implemented.
2. Raw Material mode: already implemented.
3. Retail mode: already implemented.
4. Service mode: still planned only. Do not implement service mode unless required to keep the architecture clean.

Important architecture:

* The app supports business mode switching.
* Business mode selection is handled through `/select-mode`.
* Selected mode may be stored as `currentBusinessMode`.
* The main scope for this task is:

  * Restaurant mode
  * Raw Material mode
  * Retail mode
  * Business mode switcher / guard / routing logic

Before changing code:

1. Read all documentation files in the repository.
2. Read README, design docs, architecture docs, business flow docs, API docs, database docs, coding rules, and any markdown docs available.
3. Inspect the current folder structure.
4. Understand existing business mode boundaries before modifying anything.
5. Do not make blind refactors.

MAIN GOAL:
Perform a full quality audit and cleanup of the project so the codebase becomes more maintainable, readable, safer, faster, and easier to scale.

You must check and improve:

A. TypeScript / Typecheck

* Run the project typecheck command.
* Fix all real TypeScript errors.
* Do not silence errors with `any`, `as unknown as`, `// @ts-ignore`, or temporary hacks unless there is absolutely no alternative.
* Prefer proper typing, reusable types, schemas, and interfaces.
* Make sure type safety is preserved across business modes.

B. Build / Lint / Format

* Run build, lint, and formatting checks if scripts exist.
* Fix errors properly.
* If scripts are missing, identify what is missing and add reasonable scripts only if it fits the project.
* Do not change package manager unless the project already uses another one.

C. Business Flow Validation
Audit and fix flows for:

* Restaurant / F&B
* Raw Material
* Retail
* Business mode switcher

For each flow, check:

* Invalid transitions.
* Missing guards.
* Broken redirects.
* Wrong default mode.
* Data from one business mode leaking into another.
* Components from one mode being reused incorrectly.
* Pages reachable when mode is not selected.
* Incorrect permission assumptions.
* Missing empty states, loading states, and error states.

D. Edge Cases
Check and fix edge cases such as:

* User opens dashboard without selecting business mode.
* User refreshes page after selecting mode.
* `localStorage` is unavailable or empty.
* Invalid business mode value exists in storage.
* User switches mode while inside a mode-specific route.
* Missing data from API.
* API returns empty array.
* API returns error.
* Slow network.
* Duplicate submit.
* Invalid form input.
* Deleted or unavailable entity.
* Concurrent state issues where possible.
* Role mismatch.
* Unauthorized access.
* Broken route after refactor.

E. Hardcoded Values
Find and remove unnecessary hardcoded values:

* Business mode strings.
* Route paths.
* Role names.
* Status labels.
* Colors repeated everywhere.
* API paths.
* Dummy data that should not be in production flow.
* Repeated table headers, select options, status maps, badge configs.

Replace them with:

* Constants.
* Config maps.
* Shared helpers.
* Type-safe enums/unions.
* Centralized route config.
* Centralized business mode config.
* Reusable status label/color helpers.

F. Duplicate Code
Find duplicate or near-duplicate code in:

* Restaurant mode
* Raw Material mode
* Retail mode
* Shared dashboards
* API handlers
* UI cards/tables/forms/modals
* Validation logic
* Formatting logic
* Fetching logic

Refactor duplicate logic into:

* Shared components.
* Feature-specific helpers.
* Shared hooks.
* Utility functions.
* Config-driven rendering.
* Reusable API helpers.
* Reusable validation schemas.

Do not over-abstract. If abstraction makes the code harder to read, keep it local.

G. Fat Files / Large Components
Find files that are too large or doing too many things.

Refactor large files by splitting into:

* `components`
* `hooks`
* `lib`
* `utils`
* `constants`
* `types`
* `schemas`
* `services`
* `api`
* `config`

Rules:

* Do not split files just to create more files.
* Split only when it improves readability or reuse.
* Keep business logic away from UI components when possible.
* Keep API/database logic away from visual components.

H. Folder Structure Cleanup
Review and improve the folder structure.

Goals:

* Restaurant, Raw Material, and Retail modes must have clear boundaries.
* Shared code must live in shared/core folders, not hidden inside one business mode.
* Business mode switcher logic must be centralized.
* Avoid random folders and ambiguous names.
* Rename files/folders if names are misleading.

Preferred structure style:

* `components/core` for app shell, route guards, global layout pieces.
* `components/shared` for reusable UI primitives.
* `features/{business-mode}` for mode-specific business logic.
* `features/shared` for dashboards or features used by multiple modes.
* `lib` for low-level helpers, API clients, auth, db utilities.
* `config` for mode config, routes, navigation, status maps.
* `types` for shared types.
* `schemas` for validation schemas.

Adapt this to the actual repository. Do not force the exact structure if the existing project has a better consistent pattern.

I. Naming Cleanup
Rename unclear files, variables, functions, and components.

Rules:

* Names must describe purpose.
* Avoid vague names like `data`, `items`, `handler`, `thing`, `newFile`, `test`, `temp`, `final`, `old`.
* Components should use PascalCase.
* Hooks should start with `use`.
* Helpers should use clear verbs/nouns.
* API helpers should clearly say what they fetch, create, update, or delete.

J. Dead Code / Unused Files
Find and remove:

* Unused components.
* Unused imports.
* Unused constants.
* Unused helper functions.
* Old backup files.
* Temporary files.
* Dead pages.
* Unused mock data.
* Duplicate old versions of files.
* Console logs used for debugging.

Important:

* Do not delete anything unless you are confident it is unused.
* If unsure, leave a comment in the final report instead of deleting.
* Never delete documentation unless it is clearly obsolete and replaced.

K. Security Hardening
Audit and improve security where relevant:

* API route authorization.
* Role-based access control.
* Business mode access control.
* Input validation.
* Server-side validation, not only client-side validation.
* Safe error responses.
* Avoid leaking stack traces or internal DB errors to the client.
* Avoid trusting client-provided business mode blindly.
* Check ownership/tenant boundaries if restaurant/business/user IDs exist.
* Prevent unauthorized access to mode-specific data.
* Validate route params.
* Validate request body.
* Avoid unsafe direct object access.

Do not add complex enterprise security systems unless needed. Improve practical security.

L. Backend / API Polish
For API routes:

* Standardize response format.
* Standardize error handling.
* Standardize validation.
* Avoid duplicated try/catch patterns if a helper can clean it.
* Ensure correct status codes.
* Avoid returning sensitive fields.
* Avoid mixing business logic directly inside route handlers when it should be in a service/helper.
* Ensure database queries are scoped properly.
* Improve performance of expensive queries if obvious.

M. Performance
Improve obvious performance issues:

* Avoid unnecessary re-renders.
* Memoize only where useful.
* Avoid huge client components if server components can be used.
* Avoid repeated calculations in render.
* Avoid duplicate API calls.
* Avoid loading all data when pagination/filtering is needed.
* Split large UI sections where appropriate.
* Improve slow pages if the cause is obvious.
* Avoid premature optimization.

N. UI Polish
Polish UI for:

* Empty states.
* Loading states.
* Error states.
* Disabled states.
* Form validation messages.
* Button consistency.
* Table readability.
* Responsive layout.
* Business mode switcher UX.
* Mode-specific dashboard clarity.
* Consistent spacing, labels, badges, and actions.

Do not redesign the entire app unless necessary. Polish existing UI.

O. Documentation Updates
After changes:

* Update docs if architecture, folder structure, routes, helpers, or business flow changed.
* If docs are missing critical information, add concise docs.
* Document:

  * Business mode architecture.
  * Current supported modes.
  * Planned service mode status.
  * Shared helpers/configs.
  * Important flow rules.
  * How to run typecheck/build/lint.
  * Known limitations.

P. Tests / Manual Verification
If tests exist:

* Run them.
* Fix broken tests properly.
* Add tests only where useful and realistic.

If tests do not exist:

* Do not create a massive test suite.
* Add small validation/unit tests only if the repo already has a testing setup.
* Otherwise, include manual verification steps in the final report.

STRICT RULES:

1. Do not use temporary fixes.
2. Do not hide errors.
3. Do not remove important features.
4. Do not rewrite the whole app from scratch.
5. Do not implement Service mode fully. It is planned only.
6. Do not break Restaurant, Raw Material, Retail, or business mode switcher.
7. Do not create placeholder pages unless needed for routing safety.
8. Do not introduce unnecessary dependencies.
9. Do not change UI framework or styling system.
10. Do not change database schema unless required, and explain why.
11. Do not make destructive migration changes without warning.
12. Do not delete docs unless clearly obsolete.
13. Do not mix business-specific logic into shared code.
14. Do not make shared code depend on Restaurant-specific assumptions.
15. Do not leave console logs, commented-out old code, or debug files.
16. Do not over-engineer.

EXECUTION ORDER:

1. Read all docs.
2. Inspect package scripts and project structure.
3. Run typecheck.
4. Run lint/build if available.
5. Audit business mode switcher.
6. Audit Restaurant mode.
7. Audit Raw Material mode.
8. Audit Retail mode.
9. Identify duplicate code, hardcode, fat files, dead files.
10. Plan refactor in small safe steps.
11. Apply fixes incrementally.
12. Re-run typecheck/build/lint after changes.
13. Update docs.
14. Produce final report.

FINAL REPORT FORMAT:
At the end, give me a clear report with:

1. Commands run

* typecheck
* lint
* build
* tests if any

2. Errors found

* TypeScript errors
* Build errors
* Lint errors
* Runtime risks
* Flow bugs
* Security issues

3. Changes made
   Group by:

* Business mode switcher
* Restaurant mode
* Raw Material mode
* Retail mode
* Shared components/helpers
* API/backend
* UI polish
* Documentation

4. Files changed
   For each changed file:

* File path
* What changed
* Why it changed

5. Files deleted
   For each deleted file:

* File path
* Why it was safe to delete

6. New helpers/configs/components created
   For each new file:

* File path
* Purpose
* Where it is used

7. Remaining risks
   Mention anything not fixed and why.

8. Manual QA checklist
   Give me step-by-step checks I can do manually in the browser.

9. Next recommended task
   Give only the next most important task after this cleanup.

Start now by reading the documentation and inspecting the repository. Then proceed with the audit and fixes.
