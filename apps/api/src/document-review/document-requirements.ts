import type { DocumentRequirements } from './document-review.types';

const EXPECTED_TAX_RETURN_YEARS = Object.freeze([2023, 2024]);

export const DEFAULT_REQUIREMENTS: Readonly<DocumentRequirements> =
  Object.freeze({
    expectedTaxReturnYears: EXPECTED_TAX_RETURN_YEARS,
    expectedBankStatementMonths: 12,
  });
