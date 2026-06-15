import { Controller, Get, Param } from '@nestjs/common';
import type { ApplicationReview } from '../document-review/document-review.types';
import type { ApplicationListItem } from './application-list-item.types';
import { ApplicationsService } from './applications.service';

@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Get()
  list(): ApplicationListItem[] {
    return this.applicationsService.list();
  }

  @Get(':id/review')
  getReview(@Param('id') applicationId: string): ApplicationReview {
    return this.applicationsService.getReview(applicationId);
  }
}
