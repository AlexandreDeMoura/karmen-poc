import type {
  Company,
  Document,
  DocumentReviewStatus,
  FinancingRequest,
  Score,
} from '../applications/application.types';
import type { DocumentDiagnostic } from '../document-diagnostics/document-diagnostic.types';

export interface DocumentRequirements {
  expectedTaxReturnYears: number[];
  expectedBankStatementMonths: number;
}

export type ProblemCode =
  | 'MISSING_TAX_RETURN_YEAR'
  | 'MISSING_BANK_STATEMENT_MONTHS'
  | 'EXTRACTION_FAILED'
  | 'SCANNED_PDF_NO_TEXT_LAYER'
  | 'MULTIPLE_BANK_ACCOUNTS_TO_REVIEW'
  | 'HIGH_RISK_MANUAL_REVIEW';

export type ProblemSeverity = 'blocking' | 'warning' | 'info';

export type ProblemSource =
  | 'requirements_engine'
  | 'mocked_document_diagnostic'
  | 'score_context';

export type ProblemMetadata = Record<string, string | number | boolean>;

export interface DocumentProblem {
  id: string;
  code: ProblemCode;
  severity: ProblemSeverity;
  analystLabel: string;
  clientFacingLabel?: string;
  description: string;
  recommendedAction: string;
  source: ProblemSource;
  documentId?: string;
  clientFacing: boolean;
  selectedByDefault: boolean;
  metadata?: ProblemMetadata;
}

export interface ApplicationReview {
  applicationId: string;
  company: Company;
  financingRequest: FinancingRequest;
  score: Score;
  requirements: DocumentRequirements;
  documents: Document[];
  diagnostics: DocumentDiagnostic[];
  problems: DocumentProblem[];
  documentReviewStatus: DocumentReviewStatus;
}
