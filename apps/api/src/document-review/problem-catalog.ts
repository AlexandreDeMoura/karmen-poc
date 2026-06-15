import type { ProblemCode } from './document-review.types';
import type {
  ProblemCatalogEntry,
  ProblemCatalogMetadata,
} from './problem-catalog.types';

type ProblemCatalog = Readonly<
  Record<ProblemCode, Readonly<ProblemCatalogEntry>>
>;

export const PROBLEM_CATALOG: ProblemCatalog = Object.freeze({
  MISSING_TAX_RETURN_YEAR: catalogEntry({
    code: 'MISSING_TAX_RETURN_YEAR',
    defaultSeverity: 'blocking',
    clientFacing: true,
    selectedByDefault: true,
    analystLabel: 'Liasse fiscale manquante',
    recommendedAction: 'Demander la liasse fiscale manquante au client',
    buildDescription: (metadata) =>
      `Aucune liasse fiscale n’a été reçue pour l’exercice ${readNumber(metadata, 'year')}.`,
    buildClientFacingLabel: (metadata) =>
      `Liasse fiscale manquante pour l’exercice ${readNumber(metadata, 'year')}`,
    buildEmailFragment: (metadata) =>
      `la liasse fiscale de l’exercice ${readNumber(metadata, 'year')}`,
  }),
  MISSING_BANK_STATEMENT_MONTHS: catalogEntry({
    code: 'MISSING_BANK_STATEMENT_MONTHS',
    defaultSeverity: 'blocking',
    clientFacing: true,
    selectedByDefault: true,
    analystLabel: 'Période de relevés bancaires insuffisante',
    recommendedAction: 'Demander les relevés bancaires manquants',
    buildDescription: buildMissingBankStatementDescription,
    buildClientFacingLabel: (metadata) =>
      `Les relevés bancaires couvrent ${readNumber(metadata, 'detectedMonths')}/${readNumber(metadata, 'expectedMonths')} mois requis`,
    buildEmailFragment: () =>
      'les relevés bancaires manquants afin de couvrir les 12 derniers mois',
  }),
  EXTRACTION_FAILED: catalogEntry({
    code: 'EXTRACTION_FAILED',
    defaultSeverity: 'warning',
    clientFacing: false,
    selectedByDefault: false,
    analystLabel: 'Échec de l’extraction du document',
    recommendedAction:
      'Contrôler manuellement le document et l’échec de l’extraction',
    buildDescription: (metadata) =>
      `L’extraction a échoué pour ${readDocumentReference(metadata)}.`,
  }),
  SCANNED_PDF_NO_TEXT_LAYER: catalogEntry({
    code: 'SCANNED_PDF_NO_TEXT_LAYER',
    defaultSeverity: 'blocking',
    clientFacing: true,
    selectedByDefault: true,
    analystLabel: 'PDF numérisé sans couche de texte',
    recommendedAction: 'Demander le PDF natif d’origine',
    buildDescription: (metadata) =>
      `${capitalize(readDocumentReference(metadata))} semble être un PDF numérisé sans couche de texte.`,
    buildClientFacingLabel: () =>
      'Le document transmis semble être un PDF numérisé',
    buildEmailFragment: () =>
      'le PDF original téléchargé depuis votre espace bancaire ou votre logiciel comptable, plutôt qu’un scan ou une photo',
  }),
  MULTIPLE_BANK_ACCOUNTS_TO_REVIEW: catalogEntry({
    code: 'MULTIPLE_BANK_ACCOUNTS_TO_REVIEW',
    defaultSeverity: 'info',
    clientFacing: false,
    selectedByDefault: false,
    analystLabel: 'Plusieurs comptes bancaires à contrôler',
    recommendedAction:
      'Confirmer que tous les comptes bancaires concernés ont été contrôlés',
    buildDescription: (metadata) =>
      `${readNumber(metadata, 'accountCount')} comptes bancaires ont été détectés pour cette demande.`,
  }),
  HIGH_RISK_MANUAL_REVIEW: catalogEntry({
    code: 'HIGH_RISK_MANUAL_REVIEW',
    defaultSeverity: 'warning',
    clientFacing: false,
    selectedByDefault: false,
    analystLabel: 'Demande à risque élevé nécessitant un contrôle manuel',
    recommendedAction:
      'Contrôler les indicateurs financiers avant de prendre une décision',
    buildDescription: () =>
      'La demande présente un risque élevé et nécessite un contrôle par un analyste.',
  }),
});

export function getProblemCatalogEntry(
  code: ProblemCode,
): Readonly<ProblemCatalogEntry> {
  return PROBLEM_CATALOG[code];
}

function catalogEntry(
  entry: ProblemCatalogEntry,
): Readonly<ProblemCatalogEntry> {
  return Object.freeze(entry);
}

function readNumber(
  metadata: ProblemCatalogMetadata,
  property: string,
): number {
  const value = metadata[property];

  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new TypeError(
      `Problem metadata property "${property}" must be a finite number`,
    );
  }

  return value;
}

function readOptionalString(
  metadata: ProblemCatalogMetadata,
  property: string,
): string | undefined {
  const value = metadata[property];

  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== 'string') {
    throw new TypeError(
      `Problem metadata property "${property}" must be a string`,
    );
  }

  return value;
}

function readDocumentReference(metadata: ProblemCatalogMetadata): string {
  const documentName = readOptionalString(metadata, 'documentName');
  const documentId = readOptionalString(metadata, 'documentId');

  if (documentName) {
    return `le document « ${documentName} »`;
  }

  if (documentId) {
    return `le document « ${documentId} »`;
  }

  throw new TypeError(
    'Problem metadata must include "documentName" or "documentId"',
  );
}

function capitalize(value: string): string {
  return `${value[0].toUpperCase()}${value.slice(1)}`;
}

function buildMissingBankStatementDescription(
  metadata: ProblemCatalogMetadata,
): string {
  const detectedMonths = readNumber(metadata, 'detectedMonths');
  const expectedMonths = readNumber(metadata, 'expectedMonths');
  const account = readOptionalString(metadata, 'account');

  if (account) {
    return `Les relevés bancaires du compte ${account} couvrent ${detectedMonths} des ${expectedMonths} mois requis.`;
  }

  return `Les relevés bancaires sans identifiant de compte couvrent ${detectedMonths} des ${expectedMonths} mois requis.`;
}
