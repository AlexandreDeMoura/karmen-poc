import { Injectable } from '@nestjs/common';
import { ApplicationDataService } from './application-data.service';
import type { ApplicationListItem } from './application-list-item.types';
import { ApplicationReviewSummaryService } from './application-review-summary.service';

@Injectable()
export class ApplicationsService {
  constructor(
    private readonly applicationDataService: ApplicationDataService,
    private readonly applicationReviewSummaryService: ApplicationReviewSummaryService,
  ) {}

  list(): ApplicationListItem[] {
    return this.applicationDataService.getApplications().map((application) => {
      const { documentReviewStatus, problemSummary } =
        this.applicationReviewSummaryService.summarize(application);

      return {
        applicationId: application.financing_request.id,
        companyName: application.company.name,
        financingType: application.financing_request.type,
        requestedAmount: application.financing_request.amount,
        riskBucket: application.score.risk_bucket,
        globalScore: application.score.global_score,
        documentReviewStatus,
        problemSummary,
      };
    });
  }
}
