import { Module } from '@nestjs/common';
import { MockDocumentDiagnosticsService } from '../document-diagnostics/mock-document-diagnostics.service';
import { ApplicationDataService } from './application-data.service';
import { ApplicationReviewSummaryService } from './application-review-summary.service';
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';

@Module({
  controllers: [ApplicationsController],
  providers: [
    ApplicationDataService,
    ApplicationReviewSummaryService,
    MockDocumentDiagnosticsService,
    ApplicationsService,
  ],
})
export class ApplicationsModule {}
