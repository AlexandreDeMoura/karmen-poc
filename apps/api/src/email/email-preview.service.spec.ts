import { BadRequestException } from '@nestjs/common';
import { ApplicationDataService } from '../applications/application-data.service';
import { MockDocumentDiagnosticsService } from '../document-diagnostics/mock-document-diagnostics.service';
import { DocumentReviewService } from '../document-review/document-review.service';
import type { DocumentProblem } from '../document-review/document-review.types';
import { EmailPreviewService } from './email-preview.service';

describe('EmailPreviewService', () => {
  const applicationDataService = new ApplicationDataService();
  const reviewService = new DocumentReviewService(
    new MockDocumentDiagnosticsService(),
  );
  const service = new EmailPreviewService();

  const studioProblems = getProblems('fr-002');
  const transportProblems = getProblems('fr-003');
  const fleursProblems = getProblems('fr-004');
  const problems = [
    ...studioProblems,
    findProblem(fleursProblems, 'EXTRACTION_FAILED:d-012'),
    findProblem(fleursProblems, 'SCANNED_PDF_NO_TEXT_LAYER:d-012'),
    findProblem(transportProblems, 'HIGH_RISK_MANUAL_REVIEW:fr-003'),
  ];

  it('generates the exact French template in review order', () => {
    const preview = service.generatePreview(problems, [
      'HIGH_RISK_MANUAL_REVIEW:fr-003',
      'SCANNED_PDF_NO_TEXT_LAYER:d-012',
      'MISSING_BANK_STATEMENT_MONTHS:FR7630004000001',
      'EXTRACTION_FAILED:d-012',
      'MISSING_TAX_RETURN_YEAR:2023',
    ]);

    expect(preview).toEqual({
      subject:
        'Documents complémentaires nécessaires pour finaliser votre demande',
      body: [
        'Bonjour,',
        '',
        'Merci pour les documents transmis.',
        '',
        'Pour finaliser l’analyse de votre demande, pouvez-vous nous transmettre :',
        '',
        '- la liasse fiscale de l’exercice 2023 ;',
        '- les relevés bancaires manquants afin de couvrir les 12 derniers mois ;',
        '- le PDF original téléchargé depuis votre espace bancaire ou votre logiciel comptable, plutôt qu’un scan ou une photo.',
        '',
        'Merci d’avance,',
        '',
        'L’équipe Karmen',
      ].join('\n'),
      includedProblemIds: [
        'MISSING_TAX_RETURN_YEAR:2023',
        'MISSING_BANK_STATEMENT_MONTHS:FR7630004000001',
        'SCANNED_PDF_NO_TEXT_LAYER:d-012',
      ],
    });
  });

  it('produces identical output regardless of selected ID order', () => {
    const first = service.generatePreview(studioProblems, [
      'MISSING_BANK_STATEMENT_MONTHS:FR7630004000001',
      'MISSING_TAX_RETURN_YEAR:2023',
    ]);
    const second = service.generatePreview(studioProblems, [
      'MISSING_TAX_RETURN_YEAR:2023',
      'MISSING_BANK_STATEMENT_MONTHS:FR7630004000001',
    ]);

    expect(first).toEqual(second);
  });

  it('does not expose analyst-only or internal review wording', () => {
    const preview = service.generatePreview(problems, [
      'MISSING_TAX_RETURN_YEAR:2023',
      'EXTRACTION_FAILED:d-012',
      'HIGH_RISK_MANUAL_REVIEW:fr-003',
    ]);

    expect(preview.includedProblemIds).toEqual([
      'MISSING_TAX_RETURN_YEAR:2023',
    ]);
    expect(preview.body).not.toMatch(
      /extraction|high[- ]risk|manual review|risk bucket|OCR/i,
    );
  });

  it.each([
    undefined,
    null,
    {},
    'MISSING_TAX_RETURN_YEAR:2023',
    [123],
    ['MISSING_TAX_RETURN_YEAR:2023', null],
  ])('rejects malformed selected problem IDs: %p', (selectedProblemIds) => {
    expect(() => service.generatePreview(problems, selectedProblemIds)).toThrow(
      new BadRequestException(
        'selectedProblemIds doit être un tableau de chaînes de caractères',
      ),
    );
  });

  it('rejects duplicate selected problem IDs', () => {
    expect(() =>
      service.generatePreview(problems, [
        'MISSING_TAX_RETURN_YEAR:2023',
        'MISSING_TAX_RETURN_YEAR:2023',
      ]),
    ).toThrow(
      new BadRequestException(
        'Le problème sélectionné « MISSING_TAX_RETURN_YEAR:2023 » est présent plusieurs fois',
      ),
    );
  });

  it('rejects unknown selected problem IDs', () => {
    expect(() =>
      service.generatePreview(problems, ['MISSING_TAX_RETURN_YEAR:2099']),
    ).toThrow(
      new BadRequestException(
        'Le problème sélectionné « MISSING_TAX_RETURN_YEAR:2099 » est absent du contrôle de la demande',
      ),
    );
  });

  it.each<[string[]]>([
    [[]],
    [['EXTRACTION_FAILED:d-012']],
    [['HIGH_RISK_MANUAL_REVIEW:fr-003']],
  ])(
    'rejects a selection with no email-capable client problem: %p',
    (selectedProblemIds) => {
      expect(() =>
        service.generatePreview(problems, selectedProblemIds),
      ).toThrow(
        new BadRequestException(
          'Au moins un problème sélectionné doit pouvoir être communiqué au client par e-mail',
        ),
      );
    },
  );

  function getProblems(applicationId: string): DocumentProblem[] {
    const application =
      applicationDataService.getApplicationByFinancingRequestId(applicationId);

    if (!application) {
      throw new Error(`Test application "${applicationId}" not found`);
    }

    return reviewService.buildReview(application).problems;
  }
});

function findProblem(
  problems: readonly DocumentProblem[],
  problemId: string,
): DocumentProblem {
  const problem = problems.find(({ id }) => id === problemId);

  if (!problem) {
    throw new Error(`Test problem "${problemId}" not found`);
  }

  return problem;
}
