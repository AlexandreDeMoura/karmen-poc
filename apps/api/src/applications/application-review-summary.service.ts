import { Injectable } from '@nestjs/common';
import type { ProblemSummary } from './application-list-item.types';
import type { Application, DocumentReviewStatus } from './application.types';

const EXPECTED_TAX_RETURN_YEARS = [2023, 2024] as const;
const EXPECTED_BANK_STATEMENT_MONTHS = 12;
const DEFAULT_ACCOUNT_GROUP = '__default_account__';

export interface ApplicationReviewSummary {
  problemSummary: ProblemSummary;
  documentReviewStatus: DocumentReviewStatus;
}

@Injectable()
export class ApplicationReviewSummaryService {
  summarize(application: Application): ApplicationReviewSummary {
    const bankAccountCoverage = getBankAccountCoverage(application);
    const blocking =
      countMissingTaxReturnYears(application) +
      countInsufficientBankAccountCoverage(bankAccountCoverage);
    const warning = application.score.risk_bucket === 'high' ? 1 : 0;
    const info = bankAccountCoverage.size > 1 ? 1 : 0;
    const problemSummary = { blocking, warning, info };

    return {
      problemSummary,
      documentReviewStatus: getReviewStatus(problemSummary),
    };
  }
}

function countMissingTaxReturnYears(application: Application): number {
  const receivedYears = new Set(
    application.documents
      .filter((document) => document.type === 'liasse_fiscale')
      .map((document) => document.metadata.year)
      .filter((year): year is number => typeof year === 'number'),
  );

  return EXPECTED_TAX_RETURN_YEARS.filter((year) => !receivedYears.has(year))
    .length;
}

function countInsufficientBankAccountCoverage(
  coverageByAccount: ReadonlyMap<string, number>,
): number {
  return [...coverageByAccount.values()].filter(
    (monthsCovered) => monthsCovered < EXPECTED_BANK_STATEMENT_MONTHS,
  ).length;
}

function getBankAccountCoverage(
  application: Application,
): ReadonlyMap<string, number> {
  const coverageByAccount = new Map<string, number>();

  for (const document of application.documents) {
    if (document.type !== 'releve_bancaire') {
      continue;
    }

    const account = document.metadata.account?.trim() || DEFAULT_ACCOUNT_GROUP;
    const monthsCovered = Math.max(0, document.metadata.months_covered ?? 0);
    const currentCoverage = coverageByAccount.get(account) ?? 0;

    coverageByAccount.set(
      account,
      Math.min(EXPECTED_BANK_STATEMENT_MONTHS, currentCoverage + monthsCovered),
    );
  }

  return coverageByAccount;
}

function getReviewStatus(problemSummary: ProblemSummary): DocumentReviewStatus {
  if (problemSummary.blocking > 0) {
    return 'needs_action';
  }

  if (problemSummary.warning > 0 || problemSummary.info > 0) {
    return 'manual_review';
  }

  return 'complete';
}
