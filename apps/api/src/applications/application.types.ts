export type FinancingType = 'loan' | 'factoring';

export type RiskBucket = 'low' | 'medium' | 'high';

export type DocumentType = 'liasse_fiscale' | 'releve_bancaire';

export type DocumentReviewStatus =
  | 'complete'
  | 'needs_action'
  | 'manual_review';

export interface Application {
  company: Company;
  financing_request: FinancingRequest;
  documents: Document[];
  score: Score;
}

export interface Company {
  id: string;
  name: string;
  siren: string;
  businessType: string;
  legalCategory: string;
  codeNaf: string;
  creationDate: string;
  address: string;
  countryCode: string;
  postalCode: string;
  owner: string;
}

export interface FinancingRequest {
  id: string;
  type: FinancingType;
  status: string;
  company_id: string;
  fundUsage: string;
  rejectedReason: string | null;
  amount: number;
  durationInMonth: number;
  interestRate: number;
}

export interface Document {
  id: string;
  name: string;
  type: DocumentType;
  company_id: string;
  financing_request_id: string;
  metadata: {
    year?: number;
    bank?: string;
    account?: string;
    months_covered?: number;
  };
}

export interface Score {
  id: string;
  financing_request_id: string;
  risk_bucket: RiskBucket;
  global_score: number;
}
