# Manual Demo Guide

This walkthrough covers the full analyst workflow and the four deterministic
fixture scenarios.

## Start The POC

If dependencies are not installed:

```bash
npm install
```

Start both applications:

```bash
npm run dev
```

Open <http://localhost:5173>.

## Workflow

1. Review financing, risk, score, and document-review status on the
   application list.
2. Open an application to inspect company, financing, score, requirements,
   documents, diagnostics, and detected problems.
3. Keep or remove client-facing blocking-problem selections.
4. Generate an email when at least one such problem is selected.
5. Edit the generated body.
6. Copy the edited body.

Changing the checklist after generating a preview marks that preview as stale.
Regenerate it before copying.

## Scenario 1: Complete

Open **Brasserie du Marais** (`fr-001`).

Expected:

- status: `complete`;
- tax returns for 2023 and 2024;
- 12 months of bank statements;
- no detected problems;
- email generation unavailable because there is no client request.

## Scenario 2: Missing Documents

Open **Studio Pixel** (`fr-002`).

Expected:

- status: `needs_action`;
- missing 2023 tax return;
- only 6 of 12 bank-statement months;
- two blocking, client-facing problems;
- both client-facing problems selected by default.

Problem IDs:

```text
MISSING_TAX_RETURN_YEAR:2023
MISSING_BANK_STATEMENT_MONTHS:FR7630004000001
```

Generate the preview and confirm it requests the missing 2023 tax return and
the missing bank statements.

## Scenario 3: Manual Review

Open **Transport Leclerc Express** (`fr-003`).

Expected:

- status: `manual_review`;
- two bank accounts with 12 months of coverage each;
- one multiple-account information problem;
- one high-risk warning;
- both problems marked as analyst-only;
- email generation unavailable because analyst-only context cannot enter
  client communication.

Problem IDs:

```text
MULTIPLE_BANK_ACCOUNTS_TO_REVIEW:fr-003
HIGH_RISK_MANUAL_REVIEW:fr-003
```

## Scenario 4: Mocked Extraction Failure

Open **Fleurs de Saison** (`fr-004`).

Expected:

- status: `needs_action`;
- both required tax returns present;
- only 10 of 12 bank-statement months;
- document `d-012` shows a failed extraction, likely scanned PDF, and no text
  layer;
- two client-facing blocking problems and one analyst-only warning;
- insufficient bank coverage and scanned-PDF problems selected by default;
- extraction failure shown as analyst-only and not selected by default.

Problem IDs:

```text
MISSING_BANK_STATEMENT_MONTHS:FR7630002000001
EXTRACTION_FAILED:d-012
SCANNED_PDF_NO_TEXT_LAYER:d-012
```

Generate the preview and confirm it requests:

- the missing bank statements needed for 12 months of coverage;
- the original native PDF rather than a scan or photo.

The analyst-only extraction warning must not appear in the email.

## Real And Mocked Boundaries

| Layer           | POC behavior                                                      |
| --------------- | ----------------------------------------------------------------- |
| Fixture loading | Real validation, caching, and indexed lookup over local JSON      |
| Requirements    | Real deterministic rules for tax years and bank coverage          |
| Problem engine  | Real stable IDs, ordering, visibility, severity, and status rules |
| Diagnostics     | Mocked in-memory signals for `d-012` only                         |
| Email preview   | Real deterministic template generation from selected problems     |
| Email delivery  | Not implemented                                                   |

The fixture records are demo data, not production data. No PDF is uploaded,
opened, parsed, or processed by OCR.

## Manual QA Checklist

- Every desktop row and mobile card opens the matching detail route.
- Direct navigation to `/applications/fr-004` loads the detail page.
- An unsupported route shows the route-level not-found state.
- `/applications/fr-999` shows the application API not-found state and a
  retry action.
- List and detail statuses match the expected scenarios above.
- Documents and the `d-012` mocked diagnostic are attached to the correct
  application.
- Client-facing and analyst-only problems are visibly separated.
- Default checklist selections match the scenarios above.
- Clearing all client-facing selections disables email generation and shows
  guidance.
- Analyst-only problems cannot be selected and never appear in generated
  email.
- Changing selection after generation marks the preview stale.
- The generated body can be edited.
- Copy uses the current edited body and reports success or failure.
- Layout, keyboard focus, labels, and status meaning remain usable at desktop
  and narrow viewport widths.

UI behavior and appearance are intentionally left for manual QA.
