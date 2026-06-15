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
        },
        {
          applicationId: 'fr-002',
          companyName: 'Studio Pixel',
          financingType: 'loan',
          requestedAmount: 20_000,
          riskBucket: 'medium',
          globalScore: 58,
          documentReviewStatus: 'needs_action',
        },
        {
          applicationId: 'fr-003',
          companyName: 'Transport Leclerc Express',
          financingType: 'loan',
          requestedAmount: 75_000,
          riskBucket: 'high',
          globalScore: 34,
          documentReviewStatus: 'manual_review',
        },
        {
          applicationId: 'fr-004',
          companyName: 'Fleurs de Saison',
          financingType: 'factoring',
          requestedAmount: 12_000,
          riskBucket: 'medium',
          globalScore: 67,
          documentReviewStatus: 'needs_action',
        },
      ]);
  });

  it('/applications/fr-004/review (GET)', () => {
    return request(app.getHttpServer())
      .get('/applications/fr-004/review')
      .expect(200)
      .expect({
        applicationId: 'fr-004',
        company: {
          id: 'c-004',
          name: 'Fleurs de Saison',
          siren: '845612378',
          businessType: 'Fleuriste',
          legalCategory: 'EURL',
          codeNaf: '4776Z',
          creationDate: '2020-02-10',
          address: '24 avenue Jean Jaurès, Lyon',
          countryCode: 'FR',
          postalCode: '69007',
          owner: 'Sophie Martin',
        },
        financingRequest: {
          id: 'fr-004',
          type: 'factoring',
          status: 'pending_review',
          company_id: 'c-004',
          fundUsage: "Stock saisonnier (fêtes de fin d'année)",
          rejectedReason: null,
          amount: 12_000,
          durationInMonth: 9,
          interestRate: 4.5,
        },
        score: {
          id: 's-004',
          financing_request_id: 'fr-004',
          risk_bucket: 'medium',
          global_score: 67,
        },
        requirements: {
          expectedTaxReturnYears: [2023, 2024],
          expectedBankStatementMonths: 12,
        },
        documents: [
          {
            id: 'd-010',
            name: 'Liasse fiscale 2023',
            type: 'liasse_fiscale',
            company_id: 'c-004',
            financing_request_id: 'fr-004',
            metadata: { year: 2023 },
          },
          {
            id: 'd-011',
            name: 'Liasse fiscale 2024',
            type: 'liasse_fiscale',
            company_id: 'c-004',
            financing_request_id: 'fr-004',
            metadata: { year: 2024 },
          },
          {
            id: 'd-012',
            name: 'Relevés LCL janv-oct 2024',
            type: 'releve_bancaire',
            company_id: 'c-004',
            financing_request_id: 'fr-004',
            metadata: {
              bank: 'LCL',
              account: 'FR7630002000001',
              months_covered: 10,
            },
          },
        ],
        diagnostics: [
          {
            documentId: 'd-012',
            extractionStatus: 'failed',
            source: 'mocked_document_pipeline',
            pdfPrecheck: {
              hasTextLayer: false,
              likelyScannedPdf: true,
            },
          },
        ],
        problems: [
          {
            id: 'MISSING_BANK_STATEMENT_MONTHS:FR7630002000001',
            code: 'MISSING_BANK_STATEMENT_MONTHS',
            severity: 'blocking',
            analystLabel: 'Période de relevés bancaires insuffisante',
            clientFacingLabel:
              'Les relevés bancaires couvrent 10/12 mois requis',
            description:
              'Les relevés bancaires du compte FR7630002000001 couvrent 10 des 12 mois requis.',
            recommendedAction: 'Demander les relevés bancaires manquants',
            source: 'requirements_engine',
            clientFacing: true,
            selectedByDefault: true,
            metadata: {
              detectedMonths: 10,
              expectedMonths: 12,
              missingMonths: 2,
              account: 'FR7630002000001',
              bank: 'LCL',
            },
          },
          {
            id: 'EXTRACTION_FAILED:d-012',
            code: 'EXTRACTION_FAILED',
            severity: 'warning',
            analystLabel: 'Échec de l’extraction du document',
            description:
              'L’extraction a échoué pour le document « Relevés LCL janv-oct 2024 ».',
            recommendedAction:
              'Contrôler manuellement le document et l’échec de l’extraction',
            source: 'mocked_document_diagnostic',
            documentId: 'd-012',
            clientFacing: false,
            selectedByDefault: false,
            metadata: {
              documentId: 'd-012',
              documentName: 'Relevés LCL janv-oct 2024',
            },
          },
          {
            id: 'SCANNED_PDF_NO_TEXT_LAYER:d-012',
            code: 'SCANNED_PDF_NO_TEXT_LAYER',
            severity: 'blocking',
            analystLabel: 'PDF numérisé sans couche de texte',
            clientFacingLabel:
              'Le document transmis semble être un PDF numérisé',
            description:
              'Le document « Relevés LCL janv-oct 2024 » semble être un PDF numérisé sans couche de texte.',
            recommendedAction: 'Demander le PDF natif d’origine',
            source: 'mocked_document_diagnostic',
            documentId: 'd-012',
            clientFacing: true,
            selectedByDefault: true,
            metadata: {
              documentId: 'd-012',
              documentName: 'Relevés LCL janv-oct 2024',
            },
          },
        ],
        documentReviewStatus: 'needs_action',
      });
  });

  it('/applications/fr-999/review (GET) returns 404', () => {
    return request(app.getHttpServer())
      .get('/applications/fr-999/review')
      .expect(404)
      .expect({
        message: 'Demande « fr-999 » introuvable',
        error: 'Not Found',
        statusCode: 404,
      });
  });

  it('/applications/fr-004/email-preview (POST)', () => {
    return request(app.getHttpServer())
      .post('/applications/fr-004/email-preview')
      .send({
        selectedProblemIds: [
          'SCANNED_PDF_NO_TEXT_LAYER:d-012',
          'MISSING_BANK_STATEMENT_MONTHS:FR7630002000001',
        ],
      })
      .expect(200)
      .expect({
        subject:
          'Documents complémentaires nécessaires pour finaliser votre demande',
        body: [
          'Bonjour,',
          '',
          'Merci pour les documents transmis.',
          '',
          'Pour finaliser l’analyse de votre demande, pouvez-vous nous transmettre :',
          '',
          '- les relevés bancaires manquants afin de couvrir les 12 derniers mois ;',
          '- le PDF original téléchargé depuis votre espace bancaire ou votre logiciel comptable, plutôt qu’un scan ou une photo.',
          '',
          'Merci d’avance,',
          '',
          'L’équipe Karmen',
        ].join('\n'),
        includedProblemIds: [
          'MISSING_BANK_STATEMENT_MONTHS:FR7630002000001',
          'SCANNED_PDF_NO_TEXT_LAYER:d-012',
        ],
      });
  });

  it('/applications/fr-004/email-preview (POST) returns 400 for invalid selection', () => {
    return request(app.getHttpServer())
      .post('/applications/fr-004/email-preview')
      .send({ selectedProblemIds: 'MISSING_BANK_STATEMENT_MONTHS' })
      .expect(400)
      .expect({
        message:
          'selectedProblemIds doit être un tableau de chaînes de caractères',
        error: 'Bad Request',
        statusCode: 400,
      });
  });

  it('/applications/fr-999/email-preview (POST) returns 404', () => {
    return request(app.getHttpServer())
      .post('/applications/fr-999/email-preview')
      .send({ selectedProblemIds: ['MISSING_TAX_RETURN_YEAR:2023'] })
      .expect(404)
      .expect({
        message: 'Demande « fr-999 » introuvable',
        error: 'Not Found',
        statusCode: 404,
      });
  });

  afterEach(async () => {
    await app.close();
  });
});
