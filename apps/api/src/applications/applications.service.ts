import { Injectable, NotFoundException } from '@nestjs/common';
import { DocumentReviewService } from '../document-review/document-review.service';
import type { ApplicationReview } from '../document-review/document-review.types';
import { EmailPreviewService } from '../email/email-preview.service';
import type { EmailPreview } from '../email/email-preview.types';
import { ApplicationDataService } from './application-data.service';
import type { ApplicationListItem } from './application-list-item.types';
import type { Application } from './application.types';

@Injectable()
export class ApplicationsService {
  constructor(
    private readonly applicationDataService: ApplicationDataService,
    private readonly documentReviewService: DocumentReviewService,
    private readonly emailPreviewService: EmailPreviewService,
  ) {}

  getById(applicationId: string): Application {
    const application =
      this.applicationDataService.getApplicationByFinancingRequestId(
        applicationId,
      );

    if (!application) {
      throw new NotFoundException(`Application "${applicationId}" not found`);
    }

    return application;
  }

  list(): ApplicationListItem[] {
    return this.applicationDataService.getApplications().map((application) => {
      const review = this.documentReviewService.buildReview(application);

      return {
        applicationId: application.financing_request.id,
        companyName: application.company.name,
        financingType: application.financing_request.type,
        requestedAmount: application.financing_request.amount,
        riskBucket: application.score.risk_bucket,
        globalScore: application.score.global_score,
        documentReviewStatus: review.documentReviewStatus,
        problemSummary: this.documentReviewService.summarizeProblems(
          review.problems,
        ),
      };
    });
  }

  getReview(applicationId: string): ApplicationReview {
    return this.documentReviewService.buildReview(this.getById(applicationId));
  }

  generateEmailPreview(
    applicationId: string,
    selectedProblemIds: unknown,
  ): EmailPreview {
    const review = this.getReview(applicationId);

    return this.emailPreviewService.generatePreview(
      review.problems,
      selectedProblemIds,
    );
  }
}
