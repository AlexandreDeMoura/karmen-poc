import { Injectable } from '@nestjs/common';
import type { Application, Document } from '../applications/application.types';
import type { DocumentDiagnostic } from '../document-diagnostics/document-diagnostic.types';
import { MockDocumentDiagnosticsService } from '../document-diagnostics/mock-document-diagnostics.service';
import { DEFAULT_REQUIREMENTS } from './document-requirements';
import type {
  ApplicationReview,
  DocumentProblem,
  ProblemCode,
  ProblemMetadata,
  ProblemSeverity,
  ProblemSource,
} from './document-review.types';
import { getProblemCatalogEntry } from './problem-catalog';

const DEFAULT_ACCOUNT_KEY = 'default-account';

interface BankAccountCoverage {
  readonly accountKey: string;
  readonly account?: string;
  readonly bank?: string;
  readonly detectedMonths: number;
}

@Injectable()
export class DocumentReviewService {
  constructor(
    private readonly diagnosticsService: MockDocumentDiagnosticsService,
  ) {}

  buildReview(application: Application): ApplicationReview {
    const diagnostics = [
      ...this.diagnosticsService.getDiagnostics(application),
    ];
    const problems = this.detectProblems(application, diagnostics);

    return {
      applicationId: application.financing_request.id,
      company: application.company,
      financingRequest: application.financing_request,
      score: application.score,
      requirements: DEFAULT_REQUIREMENTS,
      documents: application.documents,
      diagnostics,
      problems,
      documentReviewStatus: this.computeReviewStatus(problems),
    };
  }

  detectProblems(
    application: Application,
    diagnostics: readonly DocumentDiagnostic[] = this.diagnosticsService.getDiagnostics(
      application,
    ),
  ): DocumentProblem[] {
    return [
      ...this.detectRequirementProblems(application),
      ...this.mapDiagnosticsToProblems(application, diagnostics),
      ...this.detectContextProblems(application),
    ];
  }

  detectRequirementProblems(application: Application): DocumentProblem[] {
    const problems: DocumentProblem[] = [];
    const receivedTaxYears = new Set(
      application.documents
        .filter((document) => document.type === 'liasse_fiscale')
        .map((document) => document.metadata.year)
        .filter((year): year is number => typeof year === 'number'),
    );

    for (const year of DEFAULT_REQUIREMENTS.expectedTaxReturnYears) {
      if (!receivedTaxYears.has(year)) {
        problems.push(
          createProblem(
            'MISSING_TAX_RETURN_YEAR',
            String(year),
            'requirements_engine',
            { year },
          ),
        );
      }
    }

    for (const coverage of getBankAccountCoverage(application.documents)) {
      if (
        coverage.detectedMonths >=
        DEFAULT_REQUIREMENTS.expectedBankStatementMonths
      ) {
        continue;
      }

      const metadata: ProblemMetadata = {
        detectedMonths: coverage.detectedMonths,
        expectedMonths: DEFAULT_REQUIREMENTS.expectedBankStatementMonths,
        missingMonths:
          DEFAULT_REQUIREMENTS.expectedBankStatementMonths -
          coverage.detectedMonths,
      };

      if (coverage.account) {
        metadata.account = coverage.account;
      }

      if (coverage.bank) {
        metadata.bank = coverage.bank;
      }

      problems.push(
        createProblem(
          'MISSING_BANK_STATEMENT_MONTHS',
          coverage.accountKey,
          'requirements_engine',
          metadata,
        ),
      );
    }

    return problems;
  }

  mapDiagnosticsToProblems(
    application: Application,
    diagnostics: readonly DocumentDiagnostic[],
  ): DocumentProblem[] {
    const diagnosticByDocumentId = new Map(
      diagnostics.map((diagnostic) => [diagnostic.documentId, diagnostic]),
    );
    const problems: DocumentProblem[] = [];

    for (const document of application.documents) {
      const diagnostic = diagnosticByDocumentId.get(document.id);

      if (!diagnostic) {
        continue;
      }

      const metadata: ProblemMetadata = {
        documentId: document.id,
        documentName: document.name,
      };

      if (diagnostic.extractionStatus === 'failed') {
        problems.push(
          createProblem(
            'EXTRACTION_FAILED',
            document.id,
            'mocked_document_diagnostic',
            metadata,
            document.id,
          ),
        );
      }

      if (
        diagnostic.pdfPrecheck?.likelyScannedPdf === true ||
        diagnostic.pdfPrecheck?.hasTextLayer === false
      ) {
        problems.push(
          createProblem(
            'SCANNED_PDF_NO_TEXT_LAYER',
            document.id,
            'mocked_document_diagnostic',
            metadata,
            document.id,
          ),
        );
      }
    }

    return problems;
  }

  detectContextProblems(application: Application): DocumentProblem[] {
    const problems: DocumentProblem[] = [];
    const accountCount = getBankAccountCoverage(application.documents).length;
    const applicationId = application.financing_request.id;

    if (accountCount > 1) {
      problems.push(
        createProblem(
          'MULTIPLE_BANK_ACCOUNTS_TO_REVIEW',
          applicationId,
          'requirements_engine',
          { accountCount },
        ),
      );
    }

    if (application.score.risk_bucket === 'high') {
      problems.push(
        createProblem(
          'HIGH_RISK_MANUAL_REVIEW',
          applicationId,
          'score_context',
          {
            riskBucket: application.score.risk_bucket,
            globalScore: application.score.global_score,
          },
        ),
      );
    }

    return problems;
  }

  computeReviewStatus(
    problems: readonly DocumentProblem[],
  ): ApplicationReview['documentReviewStatus'] {
    if (
      problems.some(
        (problem) => problem.clientFacing && problem.severity === 'blocking',
      )
    ) {
      return 'needs_action';
    }

    if (
      problems.some(
        (problem) =>
          !problem.clientFacing &&
          (problem.severity === 'warning' || problem.severity === 'info'),
      )
    ) {
      return 'manual_review';
    }

    return 'complete';
  }

  summarizeProblems(
    problems: readonly DocumentProblem[],
  ): Record<ProblemSeverity, number> {
    return problems.reduce<Record<ProblemSeverity, number>>(
      (summary, problem) => {
        summary[problem.severity] += 1;
        return summary;
      },
      { blocking: 0, warning: 0, info: 0 },
    );
  }
}

function getBankAccountCoverage(
  documents: readonly Document[],
): BankAccountCoverage[] {
  const coverageByAccount = new Map<string, BankAccountCoverage>();

  for (const document of documents) {
    if (document.type !== 'releve_bancaire') {
      continue;
    }

    const account = document.metadata.account?.trim() || undefined;
    const accountKey = account ?? DEFAULT_ACCOUNT_KEY;
    const currentCoverage = coverageByAccount.get(accountKey);
    const monthsCovered = Math.max(0, document.metadata.months_covered ?? 0);

    coverageByAccount.set(accountKey, {
      accountKey,
      account,
      bank:
        currentCoverage?.bank ?? (document.metadata.bank?.trim() || undefined),
      detectedMonths: Math.min(
        DEFAULT_REQUIREMENTS.expectedBankStatementMonths,
        (currentCoverage?.detectedMonths ?? 0) + monthsCovered,
      ),
    });
  }

  if (coverageByAccount.size === 0) {
    coverageByAccount.set(DEFAULT_ACCOUNT_KEY, {
      accountKey: DEFAULT_ACCOUNT_KEY,
      detectedMonths: 0,
    });
  }

  return [...coverageByAccount.values()];
}

function createProblem(
  code: ProblemCode,
  subject: string,
  source: ProblemSource,
  metadata: ProblemMetadata,
  documentId?: string,
): DocumentProblem {
  const catalogEntry = getProblemCatalogEntry(code);

  return {
    id: `${code}:${subject}`,
    code,
    severity: catalogEntry.defaultSeverity,
    analystLabel: catalogEntry.analystLabel,
    clientFacingLabel: catalogEntry.buildClientFacingLabel?.(metadata),
    description: catalogEntry.buildDescription(metadata),
    recommendedAction: catalogEntry.recommendedAction,
    source,
    documentId,
    clientFacing: catalogEntry.clientFacing,
    selectedByDefault: catalogEntry.selectedByDefault,
    metadata,
  };
}
