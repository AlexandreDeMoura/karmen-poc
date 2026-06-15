import { ApplicationDataService } from './application-data.service';
import { ApplicationReviewSummaryService } from './application-review-summary.service';
import { ApplicationsService } from './applications.service';

describe('ApplicationsService', () => {
  it('projects the four fixtures into deterministic list items', () => {
    const service = new ApplicationsService(
      new ApplicationDataService(),
      new ApplicationReviewSummaryService(),
    );

    expect(service.list()).toEqual([
      {
        applicationId: 'fr-001',
        companyName: 'Brasserie du Marais',
        financingType: 'loan',
        requestedAmount: 35_000,
        riskBucket: 'low',
        globalScore: 82,
        documentReviewStatus: 'complete',
        problemSummary: { blocking: 0, warning: 0, info: 0 },
      },
      {
        applicationId: 'fr-002',
        companyName: 'Studio Pixel',
        financingType: 'loan',
        requestedAmount: 20_000,
        riskBucket: 'medium',
        globalScore: 58,
        documentReviewStatus: 'needs_action',
        problemSummary: { blocking: 2, warning: 0, info: 0 },
      },
      {
        applicationId: 'fr-003',
        companyName: 'Transport Leclerc Express',
        financingType: 'loan',
        requestedAmount: 75_000,
        riskBucket: 'high',
        globalScore: 34,
        documentReviewStatus: 'manual_review',
        problemSummary: { blocking: 0, warning: 1, info: 1 },
      },
      {
        applicationId: 'fr-004',
        companyName: 'Fleurs de Saison',
        financingType: 'factoring',
        requestedAmount: 12_000,
        riskBucket: 'medium',
        globalScore: 67,
        documentReviewStatus: 'needs_action',
        problemSummary: { blocking: 1, warning: 0, info: 0 },
      },
    ]);
  });
});
