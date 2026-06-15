import type { ProblemCode, ProblemSeverity } from './document-review.types';

export type ProblemCatalogMetadata = Record<string, unknown>;

export interface ProblemCatalogEntry {
  code: ProblemCode;
  defaultSeverity: ProblemSeverity;
  clientFacing: boolean;
  selectedByDefault: boolean;
  analystLabel: string;
  recommendedAction: string;
  buildDescription: (metadata: ProblemCatalogMetadata) => string;
  buildClientFacingLabel?: (metadata: ProblemCatalogMetadata) => string;
  buildEmailFragment?: (metadata: ProblemCatalogMetadata) => string;
}
