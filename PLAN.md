# Application List Slice Plan

## Scope

This slice covers only:

1. Loading the four application JSON fixtures into the NestJS API.
2. Exposing `GET /applications`.
3. Building the React application list at `/` and connecting it to that endpoint.

The application detail page, full document review response, mocked extraction
diagnostics, problem checklist, and email generation are deferred.

## JSON Fixture Location

Create a `data/` directory at the repository root, next to `apps/`:

```txt
/data
  brasserie-du-marais.json
  studio-pixel.json
  transport-leclerc-express.json
  fleurs-de-saison.json
```

Absolute location in this workspace:

```txt
/Users/alexandredemoura/Desktop/dev/karmen-poc/data
```

Each file should contain one application matching the `Application` shape from
`technical-prd.md`. The fixtures should be anonymized before committing them if
they originate from real customer data.

The API should read these as runtime files rather than importing them into the
TypeScript bundle. This keeps the POC data replaceable and preserves the
PRD's separation between application data and application code.

## Target Data Flow

```txt
data/*.json
    |
    v
NestJS application data loader
    |
    v
list review-summary rules
    |
    v
GET /applications
    |
    v
React ApplicationListPage at /
```

## API Response Contract

`GET /applications` returns an array of:

```ts
interface ApplicationListItem {
  applicationId: string;
  companyName: string;
  financingType: "loan" | "factoring";
  requestedAmount: number;
  riskBucket: "low" | "medium" | "high";
  globalScore: number;
  documentReviewStatus: "complete" | "needs_action" | "manual_review";
  problemSummary: {
    blocking: number;
    warning: number;
    info: number;
  };
}
```

For this POC, `applicationId` will be `financing_request.id`, because the
documented input model has no separate top-level application ID.

The response order should be deterministic. Use the fixture filename order
shown above unless a product sort order is introduced later.

## Review Summary Rules Needed by the List

Implement the smallest reusable subset of the document review domain needed to
produce the list contract. Do not hard-code statuses by company name.

1. Create one blocking problem for each missing tax return year from
   `[2023, 2024]`.
2. Group bank statement documents by `metadata.account`. Documents without an
   account value belong to one default account group.
3. Sum `metadata.months_covered` within each account group, capped at 12 for
   this POC. Create one blocking problem for each account below 12 months.
4. Create one info problem when more than one distinct bank account is present.
5. Create one warning problem when `score.risk_bucket` is `high`.
6. Return `needs_action` when at least one blocking problem exists.
7. Otherwise, return `manual_review` when at least one warning or info problem
   exists.
8. Otherwise, return `complete`.

This should produce the PRD scenarios:

| Application | Expected status |
| --- | --- |
| Brasserie du Marais | `complete` |
| Studio Pixel | `needs_action` |
| Fleurs de Saison | `needs_action` |
| Transport Leclerc Express | `manual_review` |

Mocked extraction failures are not included in this slice. They will be added
with the full diagnostics and review workflow.

## Backend Implementation

### 1. Define domain and API types

Add types under `apps/api/src/applications/` for:

- `Application`, `Company`, `FinancingRequest`, `Document`, and `Score`;
- financing, risk, document, and review status unions;
- `ApplicationListItem` and `ProblemSummary`.

Keep input fixture types separate from the list response type so the API does
not accidentally expose the complete source JSON.

### 2. Add an application data service

Create a service responsible for:

- locating the root `data/` directory independently of the shell's current
  working directory;
- reading only the four expected `.json` files;
- parsing each file once and caching the applications in memory;
- validating required object sections and identifiers with lightweight runtime
  guards;
- rejecting malformed JSON, a missing fixture, or duplicate financing request
  IDs with an error that names the offending file.

No database, persistence, or new validation dependency is needed.

Suggested file:

```txt
apps/api/src/applications/application-data.service.ts
```

### 3. Add list review-summary logic

Create a pure service or pure functions that accept an `Application` and
produce:

- problem severity counts;
- `documentReviewStatus`.

Keep this logic separate from file loading and HTTP handling so it can later be
reused by `GET /applications/:id/review`.

Suggested file:

```txt
apps/api/src/applications/application-review-summary.service.ts
```

### 4. Add the applications service and controller

Create:

```txt
apps/api/src/applications/applications.service.ts
apps/api/src/applications/applications.controller.ts
apps/api/src/applications/applications.module.ts
```

Responsibilities:

- `ApplicationsService.list()` maps loaded fixtures to
  `ApplicationListItem[]`;
- `ApplicationsController` exposes the exact route `GET /applications`;
- `ApplicationsModule` registers the loader, summary service, application
  service, and controller;
- `AppModule` imports `ApplicationsModule`.

Keep the existing `/api/health` endpoint unchanged.

### 5. Add backend tests

Cover:

- all four fixtures load successfully;
- missing and malformed fixtures fail with useful errors;
- missing 2023/2024 tax returns produce blocking counts;
- bank statement coverage below 12 months produces a blocking count;
- multiple accounts and high risk produce manual-review counts;
- status precedence is `needs_action` over `manual_review`;
- `GET /applications` returns four items with the documented response shape
  and expected statuses.

Use temporary fixture directories in loader unit tests so tests do not modify
the real `data/` directory.

## Frontend Implementation

### 1. Connect the Vite development proxy

The current proxy only forwards `/api`. Add `/applications` to
`apps/web/vite.config.ts`, targeting `http://localhost:3000`.

The frontend can then call:

```ts
fetch("/applications")
```

This preserves the exact backend endpoint requested and avoids CORS setup in
local development.

### 2. Add frontend API types and client

Suggested files:

```txt
apps/web/src/features/applications/application.types.ts
apps/web/src/features/applications/applications.api.ts
```

The API client should:

- fetch `GET /applications`;
- throw a useful error for non-2xx responses;
- support `AbortController`;
- return a typed `ApplicationListItem[]`.

### 3. Build the application list page

Replace the current health-check placeholder in `App.tsx` with an
`ApplicationListPage`. No router dependency is required yet because this slice
only owns `/`.

Suggested components:

```txt
apps/web/src/features/applications/ApplicationListPage.tsx
apps/web/src/features/applications/ApplicationListTable.tsx
apps/web/src/features/applications/ReviewStatusBadge.tsx
```

Display:

- company name;
- financing type;
- requested amount;
- risk bucket;
- global score;
- document review status;
- blocking, warning, and info problem counts.

UI behavior:

- show a loading state while fetching;
- show a clear retryable error state when the request fails;
- show an empty state when the API returns no applications;
- format amounts as EUR with `fr-FR`;
- provide readable labels for enum values;
- use semantic table markup on larger screens and remain usable on narrow
  screens;
- do not add links to detail pages until that route exists.

No new frontend package is required.

## Implementation Order

1. Add the four JSON files to root `data/`.
2. Define backend input and response types.
3. Implement and test the JSON loader.
4. Implement and test list review-summary rules.
5. Expose and test `GET /applications`.
6. Add the Vite `/applications` proxy.
7. Add the frontend API client and list components.
8. Add loading, empty, and error states.
9. Run backend automated tests and TypeScript/build checks.
10. Hand the running page to the user for manual UI QA.

## Acceptance Criteria

- The API starts with the four JSON fixtures loaded in memory.
- Invalid or missing fixture data fails clearly instead of returning partial
  results.
- `GET http://localhost:3000/applications` returns four typed list summaries.
- The four applications have the deterministic statuses defined in the PRD.
- The React root page obtains all displayed application data from the API.
- Refreshing the page preserves the list because the source is the backend,
  not hard-coded frontend data.
- Loading, empty, and API failure states are visible and understandable.
- No detail-page, diagnostics, checklist, or email functionality is included.
- No package installation is required for this slice.

## Commands

After the four fixtures are placed in `data/`, start both applications with:

```bash
npm run dev
```

Backend tests:

```bash
npm run test --workspace=apps/api
```

Frontend type-check and production build:

```bash
npm run build --workspace=apps/web
```

Direct API check:

```bash
curl http://localhost:3000/applications
```

UI behavior and appearance will be manually QA'd by the user.
