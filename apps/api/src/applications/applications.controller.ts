import { Controller, Get } from '@nestjs/common';
import type { ApplicationListItem } from './application-list-item.types';
import { ApplicationsService } from './applications.service';

@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Get()
  list(): ApplicationListItem[] {
    return this.applicationsService.list();
  }
}
