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
    buildDescription: (metadata) =>
      `No tax return was received for fiscal year ${readNumber(metadata, 'year')}.`,
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
    buildDescription: buildMissingBankStatementDescription,
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
    buildDescription: (metadata) =>
      `Extraction failed for ${readDocumentReference(metadata)}.`,
  }),
  SCANNED_PDF_NO_TEXT_LAYER: catalogEntry({
    code: 'SCANNED_PDF_NO_TEXT_LAYER',
    defaultSeverity: 'blocking',
    clientFacing: true,
    selectedByDefault: true,
    analystLabel: 'Scanned PDF without text layer',
    recommendedAction: 'Request original native PDF',
    buildDescription: (metadata) =>
      `${readDocumentReference(metadata)} appears to be a scanned PDF without a text layer.`,
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
    buildDescription: (metadata) =>
      `${readNumber(metadata, 'accountCount')} bank accounts were detected for this application.`,
  }),
  HIGH_RISK_MANUAL_REVIEW: catalogEntry({
    code: 'HIGH_RISK_MANUAL_REVIEW',
    defaultSeverity: 'warning',
    clientFacing: false,
    selectedByDefault: false,
    analystLabel: 'High-risk application requiring manual review',
    recommendedAction: 'Review financial indicators before decision',
    buildDescription: () =>
      'The application is in the high risk bucket and requires analyst review.',
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

function readOptionalString(
  metadata: ProblemCatalogMetadata,
  property: string,
): string | undefined {
  const value = metadata[property];

  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== 'string') {
    throw new TypeError(
      `Problem metadata property "${property}" must be a string`,
    );
  }

  return value;
}

function readDocumentReference(metadata: ProblemCatalogMetadata): string {
  const documentName = readOptionalString(metadata, 'documentName');
  const documentId = readOptionalString(metadata, 'documentId');

  if (documentName) {
    return `document "${documentName}"`;
  }

  if (documentId) {
    return `document "${documentId}"`;
  }

  throw new TypeError(
    'Problem metadata must include "documentName" or "documentId"',
  );
}

function buildMissingBankStatementDescription(
  metadata: ProblemCatalogMetadata,
): string {
  const detectedMonths = readNumber(metadata, 'detectedMonths');
  const expectedMonths = readNumber(metadata, 'expectedMonths');
  const account = readOptionalString(metadata, 'account');

  if (account) {
    return `Bank statements for account ${account} cover ${detectedMonths} of ${expectedMonths} required months.`;
  }

  return `Bank statements without an account identifier cover ${detectedMonths} of ${expectedMonths} required months.`;
}
