import { Module } from '@nestjs/common';
import { MockDocumentDiagnosticsService } from '../document-diagnostics/mock-document-diagnostics.service';
import { DocumentReviewService } from '../document-review/document-review.service';
import { EmailPreviewService } from '../email/email-preview.service';
import { ApplicationDataService } from './application-data.service';
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';

@Module({
  controllers: [ApplicationsController],
  providers: [
    ApplicationDataService,
    MockDocumentDiagnosticsService,
    DocumentReviewService,
    EmailPreviewService,
    ApplicationsService,
  ],
})
export class ApplicationsModule {}
