import type {
  ApplicationDocument,
  DocumentDiagnostic,
  DocumentProblem,
} from '../application.types'

interface ProblemSelection {
  selectedProblemIds: ReadonlySet<string>
  revision: number
}

interface ProblemGroups {
  clientFacingProblems: DocumentProblem[]
  analystOnlyProblems: DocumentProblem[]
}

interface DocumentGroups {
  taxReturns: ApplicationDocument[]
  bankStatements: ApplicationDocument[]
}

export function createProblemSelection(
  problems: readonly DocumentProblem[],
): ProblemSelection {
  return {
    selectedProblemIds: new Set(
      problems
        .filter(
          (problem) =>
            isClientFacingBlockingProblem(problem) &&
            problem.selectedByDefault,
        )
        .map((problem) => problem.id),
    ),
    revision: 0,
  }
}

export function changeProblemSelection(
  currentSelection: ProblemSelection,
  problemId: string,
  selected: boolean,
): ProblemSelection {
  if (currentSelection.selectedProblemIds.has(problemId) === selected) {
    return currentSelection
  }

  const selectedProblemIds = new Set(currentSelection.selectedProblemIds)

  if (selected) {
    selectedProblemIds.add(problemId)
  } else {
    selectedProblemIds.delete(problemId)
  }

  return {
    selectedProblemIds,
    revision: currentSelection.revision + 1,
  }
}

export function groupProblems(
  problems: readonly DocumentProblem[],
): ProblemGroups {
  const clientFacingProblems: DocumentProblem[] = []
  const analystOnlyProblems: DocumentProblem[] = []

  for (const problem of problems) {
    if (isClientFacingBlockingProblem(problem)) {
      clientFacingProblems.push(problem)
    } else {
      analystOnlyProblems.push(problem)
    }
  }

  return { clientFacingProblems, analystOnlyProblems }
}

export function isClientFacingBlockingProblem(
  problem: DocumentProblem,
): boolean {
  return problem.severity === 'blocking' && problem.clientFacing
}

export function getSelectedClientFacingBlockingProblems(
  problems: readonly DocumentProblem[],
  selectedProblemIds: ReadonlySet<string>,
): DocumentProblem[] {
  return problems.filter(
    (problem) =>
      isClientFacingBlockingProblem(problem) &&
      selectedProblemIds.has(problem.id),
  )
}

export function countSelectedProblems(
  problems: readonly DocumentProblem[],
  selectedProblemIds: ReadonlySet<string>,
): number {
  return problems.reduce(
    (count, problem) =>
      count + (selectedProblemIds.has(problem.id) ? 1 : 0),
    0,
  )
}

export function groupDocuments(
  documents: readonly ApplicationDocument[],
): DocumentGroups {
  const taxReturns: ApplicationDocument[] = []
  const bankStatements: ApplicationDocument[] = []

  for (const document of documents) {
    if (document.type === 'liasse_fiscale') {
      taxReturns.push(document)
    } else {
      bankStatements.push(document)
    }
  }

  return { taxReturns, bankStatements }
}

export function indexDiagnosticsByDocumentId(
  diagnostics: readonly DocumentDiagnostic[],
): ReadonlyMap<string, DocumentDiagnostic> {
  return new Map(
    diagnostics.map((diagnostic) => [
      diagnostic.documentId,
      diagnostic,
    ]),
  )
}

export function getDiagnosticSignals(
  diagnostic: DocumentDiagnostic,
): string[] {
  const signals: string[] = []

  if (diagnostic.pdfPrecheck?.hasTextLayer === false) {
    signals.push('Aucune couche de texte détectée')
  }

  if (diagnostic.pdfPrecheck?.likelyScannedPdf === true) {
    signals.push('PDF probablement numérisé')
  }

  if (diagnostic.pdfPrecheck?.isPasswordProtected === true) {
    signals.push('Protection par mot de passe détectée')
  }

  if (diagnostic.pdfPrecheck?.isCorrupted === true) {
    signals.push('Le fichier est peut-être corrompu')
  }

  if (diagnostic.qualitySignals?.lowResolution === true) {
    signals.push('Faible résolution')
  }

  if (diagnostic.qualitySignals?.blurDetected === true) {
    signals.push('Flou détecté')
  }

  if (diagnostic.qualitySignals?.croppedPageDetected === true) {
    signals.push('Page rognée détectée')
  }

  if (diagnostic.qualitySignals?.skewDetected === true) {
    signals.push('Page inclinée détectée')
  }

  return signals
}
