# API Reference

The NestJS API runs at `http://localhost:3000` by default and returns JSON.
For application requests, the Vite frontend uses an `/api` prefix that the
development proxy removes. For example, `/api/applications` is forwarded to
`http://localhost:3000/applications`.

## Endpoints

| Method | Path                              | Description                                      |
| ------ | --------------------------------- | ------------------------------------------------ |
| `GET`  | `/`                               | Return the NestJS scaffold greeting              |
| `GET`  | `/api/health`                     | Confirm that the API is available                |
| `GET`  | `/applications`                   | List applications with computed review statuses |
| `GET`  | `/applications/:id/review`        | Return a complete document review                |
| `POST` | `/applications/:id/email-preview` | Generate a deterministic client email preview    |

Application IDs are financing request IDs: `fr-001` through `fr-004`.

## List Applications

```bash
curl http://localhost:3000/applications
```

Each item has this shape:

```ts
interface ApplicationListItem {
  applicationId: string;
  companyName: string;
  financingType: "loan" | "factoring";
  requestedAmount: number;
  riskBucket: "low" | "medium" | "high";
  globalScore: number;
  documentReviewStatus: "complete" | "needs_action" | "manual_review";
}
```

The deterministic fixture results are:

| ID       | Status          |
| -------- | --------------- |
| `fr-001` | `complete`      |
| `fr-002` | `needs_action`  |
| `fr-003` | `manual_review` |
| `fr-004` | `needs_action`  |

## Get An Application Review

```bash
curl http://localhost:3000/applications/fr-004/review
```

Response shape:

```ts
interface ApplicationReview {
  applicationId: string;
  company: Company;
  financingRequest: FinancingRequest;
  score: Score;
  requirements: {
    expectedTaxReturnYears: number[];
    expectedBankStatementMonths: number;
  };
  documents: Document[];
  diagnostics: DocumentDiagnostic[];
  problems: DocumentProblem[];
  documentReviewStatus: "complete" | "needs_action" | "manual_review";
}
```

The response exposes fixture fields where they are part of nested source
objects, while the top-level financing request property is camel-cased as
`financingRequest`.

### Problem Shape

```ts
interface DocumentProblem {
  id: string;
  code: ProblemCode;
  severity: "blocking" | "warning" | "info";
  analystLabel: string;
  clientFacingLabel?: string;
  description: string;
  recommendedAction: string;
  source:
    | "requirements_engine"
    | "mocked_document_diagnostic"
    | "score_context";
  documentId?: string;
  clientFacing: boolean;
  selectedByDefault: boolean;
  metadata?: Record<string, string | number | boolean>;
}
```

Problem IDs are stable:

| Code                               | ID subject                              |
| ---------------------------------- | --------------------------------------- |
| `MISSING_TAX_RETURN_YEAR`          | Tax year                                |
| `MISSING_BANK_STATEMENT_MONTHS`    | Account identifier or `default-account` |
| `EXTRACTION_FAILED`                | Document ID                             |
| `SCANNED_PDF_NO_TEXT_LAYER`        | Document ID                             |
| `MULTIPLE_BANK_ACCOUNTS_TO_REVIEW` | Application ID                          |
| `HIGH_RISK_MANUAL_REVIEW`          | Application ID                          |

Examples:

```text
MISSING_TAX_RETURN_YEAR:2023
MISSING_BANK_STATEMENT_MONTHS:FR7630002000001
EXTRACTION_FAILED:d-012
SCANNED_PDF_NO_TEXT_LAYER:d-012
MULTIPLE_BANK_ACCOUNTS_TO_REVIEW:fr-003
HIGH_RISK_MANUAL_REVIEW:fr-003
```

### Review Status Rules

- `needs_action`: at least one client-facing blocking problem exists.
- `manual_review`: no client-facing blocker exists, but an analyst-only
  warning or information problem exists.
- `complete`: neither condition applies.

### Mocked Diagnostic

Only document `d-012` has a diagnostic:

```json
{
  "documentId": "d-012",
  "extractionStatus": "failed",
  "source": "mocked_document_pipeline",
  "pdfPrecheck": {
    "hasTextLayer": false,
    "likelyScannedPdf": true
  }
}
```

This is an in-memory mocked pipeline signal. The API does not read or inspect
a PDF.

## Generate An Email Preview

```bash
curl \
  -X POST \
  -H 'Content-Type: application/json' \
  -d '{"selectedProblemIds":["SCANNED_PDF_NO_TEXT_LAYER:d-012","MISSING_BANK_STATEMENT_MONTHS:FR7630002000001"]}' \
  http://localhost:3000/applications/fr-004/email-preview
```

Request:

```ts
interface GenerateEmailPreviewRequest {
  selectedProblemIds: string[];
}
```

Response:

```json
{
  "subject": "Documents complémentaires nécessaires pour finaliser votre demande",
  "body": "Bonjour,\n\nMerci pour les documents transmis.\n\nPour finaliser l’analyse de votre demande, pouvez-vous nous transmettre :\n\n- les relevés bancaires manquants afin de couvrir les 12 derniers mois ;\n- le PDF original téléchargé depuis votre espace bancaire ou votre logiciel comptable, plutôt qu’un scan ou une photo.\n\nMerci d’avance,\n\nL’équipe Karmen",
  "includedProblemIds": [
    "MISSING_BANK_STATEMENT_MONTHS:FR7630002000001",
    "SCANNED_PDF_NO_TEXT_LAYER:d-012"
  ]
}
```

The request may list IDs in any order. Included problems and email bullets
follow the deterministic review order.

Analyst-only problem IDs are accepted when they belong to the review but are
filtered out. At least one submitted ID must resolve to a client-facing,
email-capable problem. The frontend is stricter: it only allows client-facing
blocking problems to be selected.

The endpoint only generates a preview. It does not send or persist email.

## Errors

Unknown applications return `404`:

```bash
curl http://localhost:3000/applications/fr-999/review
```

```json
{
  "message": "Demande « fr-999 » introuvable",
  "error": "Not Found",
  "statusCode": 404
}
```

Invalid email selections return `400`. Invalid cases include:

- `selectedProblemIds` is not an array of strings;
- an ID is duplicated;
- an ID does not belong to the application review;
- no selected problem is client-facing and email-capable.

Example:

```bash
curl \
  -X POST \
  -H 'Content-Type: application/json' \
  -d '{"selectedProblemIds":[]}' \
  http://localhost:3000/applications/fr-004/email-preview
```

```json
{
  "message": "Au moins un problème sélectionné doit pouvoir être communiqué au client par e-mail",
  "error": "Bad Request",
  "statusCode": 400
}
```
