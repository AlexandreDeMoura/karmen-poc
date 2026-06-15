import type { ProblemCode } from './document-review.types';
import type {
  ProblemCatalogEntry,
  ProblemCatalogMetadata,
} from './problem-catalog.types';

type ProblemCatalog = Readonly<
  Record<ProblemCode, Readonly<ProblemCatalogEntry>>
>;

export const PROBLEM_CATALOG: ProblemCatalog = Object.freeze({
  MISSING_TAX_RETURN_YEAR: catalogEntry({
    code: 'MISSING_TAX_RETURN_YEAR',
    defaultSeverity: 'blocking',
    clientFacing: true,
    selectedByDefault: true,
    analystLabel: 'Missing tax return year',
    recommendedAction: 'Request missing tax return from client',
    buildClientFacingLabel: (metadata) =>
      `Missing tax return for fiscal year ${readNumber(metadata, 'year')}`,
    buildEmailFragment: (metadata) =>
      `the tax return for fiscal year ${readNumber(metadata, 'year')}`,
  }),
  MISSING_BANK_STATEMENT_MONTHS: catalogEntry({
    code: 'MISSING_BANK_STATEMENT_MONTHS',
    defaultSeverity: 'blocking',
    clientFacing: true,
    selectedByDefault: true,
    analystLabel: 'Insufficient bank statement coverage',
    recommendedAction: 'Request missing bank statements',
    buildClientFacingLabel: (metadata) =>
      `Bank statements cover ${readNumber(metadata, 'detectedMonths')}/${readNumber(metadata, 'expectedMonths')} required months`,
    buildEmailFragment: () =>
      'the missing bank statements required to cover the last 12 months',
  }),
  EXTRACTION_FAILED: catalogEntry({
    code: 'EXTRACTION_FAILED',
    defaultSeverity: 'warning',
    clientFacing: false,
    selectedByDefault: false,
    analystLabel: 'Document extraction failed',
    recommendedAction: 'Review the document and extraction failure manually',
  }),
  SCANNED_PDF_NO_TEXT_LAYER: catalogEntry({
    code: 'SCANNED_PDF_NO_TEXT_LAYER',
    defaultSeverity: 'blocking',
    clientFacing: true,
    selectedByDefault: true,
    analystLabel: 'Scanned PDF without text layer',
    recommendedAction: 'Request original native PDF',
    buildClientFacingLabel: () =>
      'The uploaded document appears to be a scanned PDF',
    buildEmailFragment: () =>
      'the original PDF downloaded from your bank or accounting software, instead of a scan or photo',
  }),
  MULTIPLE_BANK_ACCOUNTS_TO_REVIEW: catalogEntry({
    code: 'MULTIPLE_BANK_ACCOUNTS_TO_REVIEW',
    defaultSeverity: 'info',
    clientFacing: false,
    selectedByDefault: false,
    analystLabel: 'Multiple bank accounts require review',
    recommendedAction: 'Confirm all relevant bank accounts have been reviewed',
  }),
  HIGH_RISK_MANUAL_REVIEW: catalogEntry({
    code: 'HIGH_RISK_MANUAL_REVIEW',
    defaultSeverity: 'warning',
    clientFacing: false,
    selectedByDefault: false,
    analystLabel: 'High-risk application requiring manual review',
    recommendedAction: 'Review financial indicators before decision',
  }),
});

export function getProblemCatalogEntry(
  code: ProblemCode,
): Readonly<ProblemCatalogEntry> {
  return PROBLEM_CATALOG[code];
}

function catalogEntry(
  entry: ProblemCatalogEntry,
): Readonly<ProblemCatalogEntry> {
  return Object.freeze(entry);
}

function readNumber(
  metadata: ProblemCatalogMetadata,
  property: string,
): number {
  const value = metadata[property];

  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new TypeError(
      `Problem metadata property "${property}" must be a finite number`,
    );
  }

  return value;
}
