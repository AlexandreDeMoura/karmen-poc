# Karmen Document Readiness Assistant POC

This repository demonstrates a document-readiness workflow for credit
analysts:

```text
Application list
  -> Application detail
  -> Document requirements and diagnostics
  -> Detected problem checklist
  -> Editable client email preview
  -> Copy email body
```

## Prerequisites

- Node.js `^20.19.0` or `>=22.12.0`, matching Vite's engine requirement.
- npm with workspace support.

## Setup

Install all root and workspace dependencies:

```bash
npm install
```

Start the frontend and API together:

```bash
npm run dev
```

Open:

- Frontend: <http://localhost:5173>
- API: <http://localhost:3000>

The Vite development server proxies browser requests from `/api` to the API
on port `3000`.

To run each application separately:

```bash
npm run dev:api
npm run dev:web
```

## Checks

Run backend unit and end-to-end tests:

```bash
npm run test --workspace=apps/api
npm run test:e2e --workspace=apps/api
```

Run builds:

```bash
npm run build --workspace=apps/api
npm run build --workspace=apps/web
```

Run lint:

```bash
npm run lint --workspace=apps/api
npm run lint --workspace=apps/web
```

The API lint script includes ESLint's `--fix` option and may update files.

## API And Demo

- [API reference](docs/API.md)
- [Manual demo guide](docs/DEMO.md)

Application workflow endpoints:

```text
GET  /applications
GET  /applications/:id/review
POST /applications/:id/email-preview
```

Example requests:

```bash
curl http://localhost:3000/applications

curl http://localhost:3000/applications/fr-004/review

curl \
  -X POST \
  -H 'Content-Type: application/json' \
  -d '{"selectedProblemIds":["MISSING_BANK_STATEMENT_MONTHS:FR7630002000001","SCANNED_PDF_NO_TEXT_LAYER:d-012"]}' \
  http://localhost:3000/applications/fr-004/email-preview
```

## Demo Scenarios

| Application               | ID       | Expected status | Problems                                                                       |
| ------------------------- | -------- | --------------- | ------------------------------------------------------------------------------ |
| Brasserie du Marais       | `fr-001` | `complete`      | Complete required document set                                                 |
| Studio Pixel              | `fr-002` | `needs_action`  | Missing 2023 tax return and 6/12 bank-statement months                         |
| Transport Leclerc Express | `fr-003` | `manual_review` | Two bank accounts and high-risk context                                        |
| Fleurs de Saison          | `fr-004` | `needs_action`  | 10/12 bank-statement months plus mocked `d-012` extraction/scanned-PDF signals |

See [docs/DEMO.md](docs/DEMO.md) for the expected behavior and walkthrough.

## Real Rules And Mocked Signals

The following behavior is implemented as deterministic application logic:

- JSON fixture loading, validation, caching, and indexed lookup;
- required tax years (`2023` and `2024`);
- 12 months of bank statements per detected account;
- stable problem IDs, ordering, severities, and review status;
- analyst-only context for multiple accounts and high-risk applications;
- client-facing blocking-problem selection and template-based French email
  preview generation.

Document `d-012` has one isolated mocked diagnostic representing a failed
extraction, a likely scanned PDF, and no text layer. The diagnostic simulates
signals from a future document pipeline. No PDF is inspected and no OCR runs.

The files in [`data/`](data/) are demo fixtures, not production or customer
data.

## Email Behavior

Email previews are deterministic and template-based. In the UI, only
client-facing blocking problems can be selected; warnings, information, and
analyst-only context remain visible but cannot be selected. The API includes
selected client-facing problems with an email fragment, in review order.

The UI lets an analyst edit and copy the generated body. The application does
not send email.

## Out Of Scope

- Real OCR, PDF upload, PDF parsing, or financial-document extraction
- Real bank-statement or tax-return parsing
- Real email sending
- Authentication
- Database persistence
- Production audit logs
- Scoring model changes or automated credit decisions
- LLM-based or multilingual email generation

## Manual QA

Automated checks cover backend rules, API behavior, and application builds.
Frontend behavior and appearance require manual QA; use
[docs/DEMO.md](docs/DEMO.md) as the walkthrough.

## Repository Layout

```text
apps/api/      NestJS API and backend tests
apps/web/      React/Vite analyst interface
data/          Four validated demo application fixtures
docs/          API reference and manual demo guide
```
