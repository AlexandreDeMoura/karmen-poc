import { ApplicationDataService } from '../applications/application-data.service';
import type {
  Application,
  Document,
  RiskBucket,
} from '../applications/application.types';
import type { DocumentDiagnostic } from '../document-diagnostics/document-diagnostic.types';
import { MockDocumentDiagnosticsService } from '../document-diagnostics/mock-document-diagnostics.service';
import type { DocumentProblem } from './document-review.types';
import { DocumentReviewService } from './document-review.service';

describe('DocumentReviewService', () => {
  const diagnosticsService = new MockDocumentDiagnosticsService();
  const service = new DocumentReviewService(diagnosticsService);

  describe('requirement problems', () => {
    it('does not create tax-return problems when both expected years are present', () => {
      const problems = service.detectRequirementProblems(createApplication());

      expect(problems).toEqual([]);
    });

    it.each([
      [2023, 2024],
      [2024, 2023],
    ])(
      'creates a stable problem for missing tax year %i',
      (missingYear, receivedYear) => {
        const application = createApplication({
          documents: [
            createTaxReturnDocument(receivedYear),
            createBankStatementDocument('account-1', 12),
          ],
        });

        expect(service.detectRequirementProblems(application)).toEqual([
          expect.objectContaining({
            id: `MISSING_TAX_RETURN_YEAR:${missingYear}`,
            code: 'MISSING_TAX_RETURN_YEAR',
            severity: 'blocking',
            source: 'requirements_engine',
            clientFacing: true,
            selectedByDefault: true,
            metadata: { year: missingYear },
          }),
        ]);
      },
    );

    it('creates missing years in requirement order when both are absent', () => {
      const application = createApplication({
        documents: [createBankStatementDocument('account-1', 12)],
      });

      expect(
        service
          .detectRequirementProblems(application)
          .map((problem) => problem.id),
      ).toEqual([
        'MISSING_TAX_RETURN_YEAR:2023',
        'MISSING_TAX_RETURN_YEAR:2024',
      ]);
    });

    it('does not create a bank problem for 12 months of coverage', () => {
      const problems = service.detectRequirementProblems(createApplication());

      expect(
        problems.find(
          (problem) => problem.code === 'MISSING_BANK_STATEMENT_MONTHS',
        ),
      ).toBeUndefined();
    });

    it('creates an account-specific problem for insufficient bank coverage', () => {
      const application = createApplication({
        documents: [
          createTaxReturnDocument(2023),
          createTaxReturnDocument(2024),
          createBankStatementDocument('account-1', 7, {
            bank: 'Test Bank',
          }),
        ],
      });

      expect(service.detectRequirementProblems(application)).toEqual([
        expect.objectContaining({
          id: 'MISSING_BANK_STATEMENT_MONTHS:account-1',
          code: 'MISSING_BANK_STATEMENT_MONTHS',
          metadata: {
            account: 'account-1',
            bank: 'Test Bank',
            detectedMonths: 7,
            expectedMonths: 12,
            missingMonths: 5,
          },
        }),
      ]);
    });

    it('sums split documents for one account and caps coverage at 12 months', () => {
      const application = createApplication({
        documents: [
          createTaxReturnDocument(2023),
          createTaxReturnDocument(2024),
          createBankStatementDocument('account-1', 5),
          createBankStatementDocument('account-1', 9),
        ],
      });

      expect(service.detectRequirementProblems(application)).toEqual([]);
    });

    it('creates one problem per insufficient account in first-seen account order', () => {
      const application = createApplication({
        documents: [
          createTaxReturnDocument(2023),
          createTaxReturnDocument(2024),
          createBankStatementDocument('account-b', 8),
          createBankStatementDocument('account-a', 4),
          createBankStatementDocument('account-b', 2),
        ],
      });

      expect(
        service
          .detectRequirementProblems(application)
          .map((problem) => problem.id),
      ).toEqual([
        'MISSING_BANK_STATEMENT_MONTHS:account-b',
        'MISSING_BANK_STATEMENT_MONTHS:account-a',
      ]);
    });

    it('groups statements without an account into one stable default account', () => {
      const application = createApplication({
        documents: [
          createTaxReturnDocument(2023),
          createTaxReturnDocument(2024),
          createBankStatementDocument(undefined, 4),
          createBankStatementDocument('  ', 3),
        ],
      });

      expect(service.detectRequirementProblems(application)).toEqual([
        expect.objectContaining({
          id: 'MISSING_BANK_STATEMENT_MONTHS:default-account',
          metadata: {
            detectedMonths: 7,
            expectedMonths: 12,
            missingMonths: 5,
          },
        }),
      ]);
    });

    it('creates one zero-coverage problem when no bank statement exists', () => {
      const application = createApplication({
        documents: [
          createTaxReturnDocument(2023),
          createTaxReturnDocument(2024),
        ],
      });

      expect(service.detectRequirementProblems(application)).toEqual([
        expect.objectContaining({
          id: 'MISSING_BANK_STATEMENT_MONTHS:default-account',
          metadata: {
            detectedMonths: 0,
            expectedMonths: 12,
            missingMonths: 12,
          },
        }),
      ]);
    });
  });

  describe('diagnostic problems', () => {
    it('maps failed extraction to an analyst-only warning', () => {
      const application = createApplication();
      const bankDocument = application.documents[2];

      expect(
        service.mapDiagnosticsToProblems(application, [
          createDiagnostic(bankDocument.id, { extractionStatus: 'failed' }),
        ]),
      ).toEqual([
        expect.objectContaining({
          id: `EXTRACTION_FAILED:${bankDocument.id}`,
          code: 'EXTRACTION_FAILED',
          severity: 'warning',
          documentId: bankDocument.id,
          clientFacing: false,
          selectedByDefault: false,
          metadata: {
            documentId: bankDocument.id,
            documentName: bankDocument.name,
          },
        }),
      ]);
    });

    it.each([[{ likelyScannedPdf: true }], [{ hasTextLayer: false }]])(
      'maps a scanned/no-text-layer precheck to a client-facing blocker',
      (pdfPrecheck) => {
        const application = createApplication();
        const bankDocument = application.documents[2];

        expect(
          service.mapDiagnosticsToProblems(application, [
            createDiagnostic(bankDocument.id, {
              extractionStatus: 'partial_success',
              pdfPrecheck,
            }),
          ]),
        ).toEqual([
          expect.objectContaining({
            id: `SCANNED_PDF_NO_TEXT_LAYER:${bankDocument.id}`,
            code: 'SCANNED_PDF_NO_TEXT_LAYER',
            severity: 'blocking',
            clientFacing: true,
            selectedByDefault: true,
          }),
        ]);
      },
    );

    it('does not create a scanned problem for a successful text-layer diagnostic', () => {
      const application = createApplication();
      const bankDocument = application.documents[2];

      expect(
        service.mapDiagnosticsToProblems(application, [
          createDiagnostic(bankDocument.id, {
            extractionStatus: 'success',
            pdfPrecheck: {
              hasTextLayer: true,
              likelyScannedPdf: false,
            },
          }),
        ]),
      ).toEqual([]);
    });

    it('maps diagnostics in source document order', () => {
      const application = createApplication();
      const firstDocument = application.documents[0];
      const lastDocument = application.documents[2];
      const diagnostics = [
        createDiagnostic(lastDocument.id, { extractionStatus: 'failed' }),
        createDiagnostic(firstDocument.id, { extractionStatus: 'failed' }),
      ];

      expect(
        service
          .mapDiagnosticsToProblems(application, diagnostics)
          .map((problem) => problem.id),
      ).toEqual([
        `EXTRACTION_FAILED:${firstDocument.id}`,
        `EXTRACTION_FAILED:${lastDocument.id}`,
      ]);
    });
  });

  describe('context, ordering, status, and summaries', () => {
    it('adds multiple-account and high-risk context after diagnostics', () => {
      const application = createApplication({
        riskBucket: 'high',
        documents: [
          createBankStatementDocument('account-b', 6),
          createBankStatementDocument('account-a', 12),
        ],
      });
      const diagnostics = [
        createDiagnostic(application.documents[0].id, {
          extractionStatus: 'failed',
          pdfPrecheck: { hasTextLayer: false },
        }),
      ];

      expect(
        service
          .detectProblems(application, diagnostics)
          .map((problem) => problem.id),
      ).toEqual([
        'MISSING_TAX_RETURN_YEAR:2023',
        'MISSING_TAX_RETURN_YEAR:2024',
        'MISSING_BANK_STATEMENT_MONTHS:account-b',
        `EXTRACTION_FAILED:${application.documents[0].id}`,
        `SCANNED_PDF_NO_TEXT_LAYER:${application.documents[0].id}`,
        'MULTIPLE_BANK_ACCOUNTS_TO_REVIEW:financing-request-1',
        'HIGH_RISK_MANUAL_REVIEW:financing-request-1',
      ]);
    });

    it('uses client-facing blockers for needs_action and gives them precedence', () => {
      expect(
        service.computeReviewStatus([
          createStatusProblem({ severity: 'warning', clientFacing: false }),
          createStatusProblem({ severity: 'blocking', clientFacing: true }),
        ]),
      ).toBe('needs_action');
    });

    it('uses analyst-only warning or info problems for manual_review', () => {
      expect(
        service.computeReviewStatus([
          createStatusProblem({ severity: 'info', clientFacing: false }),
        ]),
      ).toBe('manual_review');
      expect(
        service.computeReviewStatus([
          createStatusProblem({ severity: 'warning', clientFacing: false }),
        ]),
      ).toBe('manual_review');
    });

    it('does not treat an analyst-only blocker as a client action', () => {
      expect(
        service.computeReviewStatus([
          createStatusProblem({ severity: 'blocking', clientFacing: false }),
        ]),
      ).toBe('complete');
    });

    it('returns complete for no review problems', () => {
      expect(service.computeReviewStatus([])).toBe('complete');
    });

    it('counts every returned problem by severity', () => {
      expect(
        service.summarizeProblems([
          createStatusProblem({ severity: 'blocking', clientFacing: true }),
          createStatusProblem({ severity: 'blocking', clientFacing: true }),
          createStatusProblem({ severity: 'warning', clientFacing: false }),
          createStatusProblem({ severity: 'info', clientFacing: false }),
        ]),
      ).toEqual({ blocking: 2, warning: 1, info: 1 });
    });

    it('produces the final fixture statuses and severity summaries', () => {
      const applications = new ApplicationDataService().getApplications();
      const results = Object.fromEntries(
        applications.map((application) => {
          const review = service.buildReview(application);

          return [
            application.company.name,
            {
              status: review.documentReviewStatus,
              summary: service.summarizeProblems(review.problems),
            },
          ];
        }),
      );

      expect(results).toEqual({
        'Brasserie du Marais': {
          status: 'complete',
          summary: { blocking: 0, warning: 0, info: 0 },
        },
        'Studio Pixel': {
          status: 'needs_action',
          summary: { blocking: 2, warning: 0, info: 0 },
        },
        'Transport Leclerc Express': {
          status: 'manual_review',
          summary: { blocking: 0, warning: 1, info: 1 },
        },
        'Fleurs de Saison': {
          status: 'needs_action',
          summary: { blocking: 2, warning: 1, info: 0 },
        },
      });
    });
  });

  it('builds the complete review projection without exposing fixture casing at the top level', () => {
    const application = new ApplicationDataService()
      .getApplications()
      .find(({ financing_request }) => financing_request.id === 'fr-004');

    expect(application).toBeDefined();
    const review = service.buildReview(application!);

    expect(review).toEqual({
      applicationId: 'fr-004',
      company: application!.company,
      financingRequest: application!.financing_request,
      score: application!.score,
      requirements: {
        expectedTaxReturnYears: [2023, 2024],
        expectedBankStatementMonths: 12,
      },
      documents: application!.documents,
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
        expect.objectContaining({
          id: 'MISSING_BANK_STATEMENT_MONTHS:FR7630002000001',
          code: 'MISSING_BANK_STATEMENT_MONTHS',
        }),
        expect.objectContaining({
          id: 'EXTRACTION_FAILED:d-012',
          code: 'EXTRACTION_FAILED',
          documentId: 'd-012',
        }),
        expect.objectContaining({
          id: 'SCANNED_PDF_NO_TEXT_LAYER:d-012',
          code: 'SCANNED_PDF_NO_TEXT_LAYER',
          documentId: 'd-012',
        }),
      ],
      documentReviewStatus: 'needs_action',
    });
    expect(review).not.toHaveProperty('financing_request');
  });
});

interface ApplicationOverrides {
  documents?: Document[];
  riskBucket?: RiskBucket;
}

function createApplication(overrides: ApplicationOverrides = {}): Application {
  return {
    company: {
      id: 'company-1',
      name: 'Test Company',
      siren: '123456789',
      businessType: 'Test',
      legalCategory: 'SAS',
      codeNaf: '0000Z',
      creationDate: '2020-01-01',
      address: '1 Test Street',
      countryCode: 'FR',
      postalCode: '75000',
      owner: 'Test Owner',
    },
    financing_request: {
      id: 'financing-request-1',
      type: 'loan',
      status: 'pending_review',
      company_id: 'company-1',
      fundUsage: 'Testing',
      rejectedReason: null,
      amount: 10_000,
      durationInMonth: 12,
      interestRate: 5,
    },
    documents: overrides.documents ?? [
      createTaxReturnDocument(2023),
      createTaxReturnDocument(2024),
      createBankStatementDocument('account-1', 12),
    ],
    score: {
      id: 'score-1',
      financing_request_id: 'financing-request-1',
      risk_bucket: overrides.riskBucket ?? 'low',
      global_score: 80,
    },
  };
}

function createTaxReturnDocument(year: number): Document {
  return {
    id: `tax-return-${year}`,
    name: `Tax return ${year}`,
    type: 'liasse_fiscale',
    company_id: 'company-1',
    financing_request_id: 'financing-request-1',
    metadata: { year },
  };
}

interface BankStatementOptions {
  bank?: string;
}

function createBankStatementDocument(
  account: string | undefined,
  monthsCovered: number,
  options: BankStatementOptions = {},
): Document {
  return {
    id: `bank-statement-${account ?? 'default'}-${monthsCovered}`,
    name: 'Bank statement',
    type: 'releve_bancaire',
    company_id: 'company-1',
    financing_request_id: 'financing-request-1',
    metadata: {
      account,
      bank: options.bank,
      months_covered: monthsCovered,
    },
  };
}

interface DiagnosticOverrides {
  extractionStatus?: DocumentDiagnostic['extractionStatus'];
  pdfPrecheck?: DocumentDiagnostic['pdfPrecheck'];
}

function createDiagnostic(
  documentId: string,
  overrides: DiagnosticOverrides = {},
): DocumentDiagnostic {
  return {
    documentId,
    extractionStatus: overrides.extractionStatus ?? 'success',
    source: 'mocked_document_pipeline',
    pdfPrecheck: overrides.pdfPrecheck,
  };
}

function createStatusProblem(
  overrides: Pick<DocumentProblem, 'severity' | 'clientFacing'>,
): DocumentProblem {
  return {
    id: 'problem-id',
    code: 'EXTRACTION_FAILED',
    severity: overrides.severity,
    analystLabel: 'Test problem',
    description: 'Test description',
    recommendedAction: 'Test action',
    source: 'mocked_document_diagnostic',
    clientFacing: overrides.clientFacing,
    selectedByDefault: false,
  };
}
