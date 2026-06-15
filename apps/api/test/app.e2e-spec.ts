import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  it('/api/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/health')
      .expect(200)
      .expect({ message: 'API connected' });
  });

  it('/applications (GET)', () => {
    return request(app.getHttpServer())
      .get('/applications')
      .expect(200)
      .expect([
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
          problemSummary: { blocking: 2, warning: 1, info: 0 },
        },
      ]);
  });

  afterEach(async () => {
    await app.close();
  });
});
