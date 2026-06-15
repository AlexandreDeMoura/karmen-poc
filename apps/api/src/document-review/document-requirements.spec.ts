import { DEFAULT_REQUIREMENTS } from './document-requirements';

describe('DEFAULT_REQUIREMENTS', () => {
  it('defines the immutable POC document requirements', () => {
    expect(DEFAULT_REQUIREMENTS).toEqual({
      expectedTaxReturnYears: [2023, 2024],
      expectedBankStatementMonths: 12,
    });
    expect(Object.isFrozen(DEFAULT_REQUIREMENTS)).toBe(true);
    expect(Object.isFrozen(DEFAULT_REQUIREMENTS.expectedTaxReturnYears)).toBe(
      true,
    );
  });
});
