import type { ProblemCode } from './document-review.types';
import { getProblemCatalogEntry, PROBLEM_CATALOG } from './problem-catalog';

const PROBLEM_CODES: ProblemCode[] = [
  'MISSING_TAX_RETURN_YEAR',
  'MISSING_BANK_STATEMENT_MONTHS',
  'EXTRACTION_FAILED',
  'SCANNED_PDF_NO_TEXT_LAYER',
  'MULTIPLE_BANK_ACCOUNTS_TO_REVIEW',
  'HIGH_RISK_MANUAL_REVIEW',
];

describe('PROBLEM_CATALOG', () => {
  it('contains one immutable entry for every problem code', () => {
    expect(Object.keys(PROBLEM_CATALOG)).toEqual(PROBLEM_CODES);
    expect(Object.isFrozen(PROBLEM_CATALOG)).toBe(true);

    PROBLEM_CODES.forEach((code) => {
      const entry = getProblemCatalogEntry(code);

      expect(entry.code).toBe(code);
      expect(Object.isFrozen(entry)).toBe(true);
    });
  });

  it('defines client-facing requirement wording from metadata', () => {
    const missingTaxReturn = getProblemCatalogEntry('MISSING_TAX_RETURN_YEAR');
    const missingBankMonths = getProblemCatalogEntry(
      'MISSING_BANK_STATEMENT_MONTHS',
    );

    expect(missingTaxReturn.buildClientFacingLabel?.({ year: 2023 })).toBe(
      'Liasse fiscale manquante pour l’exercice 2023',
    );
    expect(missingTaxReturn.buildEmailFragment?.({ year: 2023 })).toBe(
      'la liasse fiscale de l’exercice 2023',
    );
    expect(missingTaxReturn.buildDescription({ year: 2023 })).toBe(
      'Aucune liasse fiscale n’a été reçue pour l’exercice 2023.',
    );
    expect(
      missingBankMonths.buildClientFacingLabel?.({
        detectedMonths: 6,
        expectedMonths: 12,
      }),
    ).toBe('Les relevés bancaires couvrent 6/12 mois requis');
    expect(
      missingBankMonths.buildDescription({
        account: 'FR761234',
        detectedMonths: 6,
        expectedMonths: 12,
      }),
    ).toBe(
      'Les relevés bancaires du compte FR761234 couvrent 6 des 12 mois requis.',
    );
    expect(missingBankMonths.buildEmailFragment?.({})).toBe(
      'les relevés bancaires manquants afin de couvrir les 12 derniers mois',
    );
    expect(
      getProblemCatalogEntry('SCANNED_PDF_NO_TEXT_LAYER').buildEmailFragment?.(
        {},
      ),
    ).toBe(
      'le PDF original téléchargé depuis votre espace bancaire ou votre logiciel comptable, plutôt qu’un scan ou une photo',
    );
  });

  it('keeps analyst-only problems out of client selection', () => {
    const analystOnlyCodes: ProblemCode[] = [
      'EXTRACTION_FAILED',
      'MULTIPLE_BANK_ACCOUNTS_TO_REVIEW',
      'HIGH_RISK_MANUAL_REVIEW',
    ];

    analystOnlyCodes.forEach((code) => {
      const entry = getProblemCatalogEntry(code);

      expect(entry.clientFacing).toBe(false);
      expect(entry.selectedByDefault).toBe(false);
      expect(entry.buildClientFacingLabel).toBeUndefined();
      expect(entry.buildEmailFragment).toBeUndefined();
    });
  });

  it('rejects missing numeric metadata used by dynamic wording', () => {
    const entry = getProblemCatalogEntry('MISSING_TAX_RETURN_YEAR');

    expect(() => entry.buildClientFacingLabel?.({})).toThrow(
      'Problem metadata property "year" must be a finite number',
    );
  });
});
