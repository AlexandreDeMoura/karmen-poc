import { ApplicationDataService } from './application-data.service';
import { ApplicationReviewSummaryService } from './application-review-summary.service';
import type { Application, Document, RiskBucket } from './application.types';

describe('ApplicationReviewSummaryService', () => {
  const service = new ApplicationReviewSummaryService();

  it('counts one blocking problem for each missing tax return year', () => {
    const application = createApplication({
      documents: [createBankStatementDocument('account-1', 12)],
    });

    expect(service.summarize(application)).toEqual({
      problemSummary: { blocking: 2, warning: 0, info: 0 },
      documentReviewStatus: 'needs_action',
    });
  });

  it('groups bank statements by account and caps summed coverage at 12 months', () => {
    const application = createApplication({
      documents: [
        createTaxReturnDocument(2023),
        createTaxReturnDocument(2024),
        createBankStatementDocument('account-1', 5),
        createBankStatementDocument('account-1', 9),
        createBankStatementDocument('account-2', 8),
        createBankStatementDocument('account-3', 4),
      ],
    });

    expect(service.summarize(application)).toEqual({
      problemSummary: { blocking: 2, warning: 0, info: 1 },
      documentReviewStatus: 'needs_action',
    });
  });

  it('places bank statements without an account in one default group', () => {
    const application = createApplication({
      documents: [
        createTaxReturnDocument(2023),
        createTaxReturnDocument(2024),
        createBankStatementDocument(undefined, 6),
        createBankStatementDocument(undefined, 6),
      ],
    });

    expect(service.summarize(application)).toEqual({
      problemSummary: { blocking: 0, warning: 0, info: 0 },
      documentReviewStatus: 'complete',
    });
  });

  it('creates info and warning counts that require manual review', () => {
    const application = createApplication({
      riskBucket: 'high',
      documents: [
        createTaxReturnDocument(2023),
        createTaxReturnDocument(2024),
        createBankStatementDocument('account-1', 12),
        createBankStatementDocument('account-2', 12),
      ],
    });

    expect(service.summarize(application)).toEqual({
      problemSummary: { blocking: 0, warning: 1, info: 1 },
      documentReviewStatus: 'manual_review',
    });
  });

  it('gives needs_action precedence over manual_review findings', () => {
    const application = createApplication({
      riskBucket: 'high',
      documents: [
        createTaxReturnDocument(2024),
        createBankStatementDocument('account-1', 6),
        createBankStatementDocument('account-2', 12),
      ],
    });

    expect(service.summarize(application)).toEqual({
      problemSummary: { blocking: 2, warning: 1, info: 1 },
      documentReviewStatus: 'needs_action',
    });
  });

  it('produces the documented statuses for the four application fixtures', () => {
    const applications = new ApplicationDataService().getApplications();
    const statuses = Object.fromEntries(
      applications.map((application) => [
        application.company.name,
        service.summarize(application).documentReviewStatus,
      ]),
    );

    expect(statuses).toEqual({
      'Brasserie du Marais': 'complete',
      'Studio Pixel': 'needs_action',
      'Transport Leclerc Express': 'manual_review',
      'Fleurs de Saison': 'needs_action',
    });
  });
});

interface ApplicationOverrides {
  documents?: Document[];
  riskBucket?: RiskBucket;
}

function createApplication(overrides: ApplicationOverrides = {}): Application {
  return {
    company: {
      id: 'company-1',
      name: 'Test Company',
      siren: '123456789',
      businessType: 'Test',
      legalCategory: 'SAS',
      codeNaf: '0000Z',
      creationDate: '2020-01-01',
      address: '1 Test Street',
      countryCode: 'FR',
      postalCode: '75000',
      owner: 'Test Owner',
    },
    financing_request: {
      id: 'financing-request-1',
      type: 'loan',
      status: 'pending_review',
      company_id: 'company-1',
      fundUsage: 'Testing',
      rejectedReason: null,
      amount: 10_000,
      durationInMonth: 12,
      interestRate: 5,
    },
    documents: overrides.documents ?? [
      createTaxReturnDocument(2023),
      createTaxReturnDocument(2024),
      createBankStatementDocument('account-1', 12),
    ],
    score: {
      id: 'score-1',
      financing_request_id: 'financing-request-1',
      risk_bucket: overrides.riskBucket ?? 'low',
      global_score: 80,
    },
  };
}

function createTaxReturnDocument(year: number): Document {
  return {
    id: `tax-return-${year}`,
    name: `Tax return ${year}`,
    type: 'liasse_fiscale',
    company_id: 'company-1',
    financing_request_id: 'financing-request-1',
    metadata: { year },
  };
}

function createBankStatementDocument(
  account: string | undefined,
  monthsCovered: number,
): Document {
  return {
    id: `bank-statement-${account ?? 'default'}-${monthsCovered}`,
    name: 'Bank statement',
    type: 'releve_bancaire',
    company_id: 'company-1',
    financing_request_id: 'financing-request-1',
    metadata: {
      account,
      months_covered: monthsCovered,
    },
  };
}
