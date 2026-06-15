import { BadRequestException, NotFoundException } from '@nestjs/common';
import { MockDocumentDiagnosticsService } from '../document-diagnostics/mock-document-diagnostics.service';
import { DocumentReviewService } from '../document-review/document-review.service';
import { EmailPreviewService } from '../email/email-preview.service';
import { ApplicationDataService } from './application-data.service';
import { ApplicationsService } from './applications.service';

describe('ApplicationsService', () => {
  const diagnosticsService = new MockDocumentDiagnosticsService();
  const service = new ApplicationsService(
    new ApplicationDataService(),
    new DocumentReviewService(diagnosticsService),
    new EmailPreviewService(),
  );

  it.each([
    ['fr-001', 'Brasserie du Marais'],
    ['fr-002', 'Studio Pixel'],
    ['fr-003', 'Transport Leclerc Express'],
    ['fr-004', 'Fleurs de Saison'],
  ])('resolves application %s from the indexed fixtures', (id, companyName) => {
    expect(service.getById(id).company.name).toBe(companyName);
  });

  it('throws NotFoundException for an unknown application ID', () => {
    expect(() => service.getById('fr-999')).toThrow(NotFoundException);
    expect(() => service.getById('fr-999')).toThrow(
      'Application "fr-999" not found',
    );
  });

  it('builds a full review for an indexed application', () => {
    const review = service.getReview('fr-004');

    expect(review.applicationId).toBe('fr-004');
    expect(review.company.name).toBe('Fleurs de Saison');
    expect(review.financingRequest.id).toBe('fr-004');
    expect(review.problems.map(({ id }) => id)).toEqual([
      'MISSING_BANK_STATEMENT_MONTHS:FR7630002000001',
      'EXTRACTION_FAILED:d-012',
      'SCANNED_PDF_NO_TEXT_LAYER:d-012',
    ]);
    expect(review.documentReviewStatus).toBe('needs_action');
  });

  it('throws NotFoundException when building a review for an unknown application', () => {
    expect(() => service.getReview('fr-999')).toThrow(NotFoundException);
    expect(() => service.getReview('fr-999')).toThrow(
      'Application "fr-999" not found',
    );
  });

  it('generates an email preview from the application review problems', () => {
    expect(
      service.generateEmailPreview('fr-004', [
        'SCANNED_PDF_NO_TEXT_LAYER:d-012',
        'MISSING_BANK_STATEMENT_MONTHS:FR7630002000001',
      ]),
    ).toEqual({
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

  it('propagates email preview validation errors', () => {
    expect(() =>
      service.generateEmailPreview('fr-004', 'not-an-array'),
    ).toThrow(
      new BadRequestException('selectedProblemIds must be an array of strings'),
    );
  });

  it('throws NotFoundException before generating an email for an unknown application', () => {
    expect(() =>
      service.generateEmailPreview('fr-999', ['MISSING_TAX_RETURN_YEAR:2023']),
    ).toThrow(new NotFoundException('Application "fr-999" not found'));
  });

  it('projects the four fixtures into deterministic list items', () => {
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
        problemSummary: { blocking: 2, warning: 1, info: 0 },
      },
    ]);
  });
});
