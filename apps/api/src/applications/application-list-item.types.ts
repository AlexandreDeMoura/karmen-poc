import type {
  DocumentReviewStatus,
  FinancingType,
  RiskBucket,
} from './application.types';

export interface ApplicationListItem {
  applicationId: string;
  companyName: string;
  financingType: FinancingType;
  requestedAmount: number;
  riskBucket: RiskBucket;
  globalScore: number;
  documentReviewStatus: DocumentReviewStatus;
}
