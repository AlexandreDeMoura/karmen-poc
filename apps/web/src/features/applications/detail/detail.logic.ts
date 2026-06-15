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
        .filter((problem) => problem.selectedByDefault)
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
    if (problem.clientFacing) {
      clientFacingProblems.push(problem)
    } else {
      analystOnlyProblems.push(problem)
    }
  }

  return { clientFacingProblems, analystOnlyProblems }
}

export function getSelectedClientFacingProblems(
  problems: readonly DocumentProblem[],
  selectedProblemIds: ReadonlySet<string>,
): DocumentProblem[] {
  return problems.filter(
    (problem) =>
      problem.clientFacing && selectedProblemIds.has(problem.id),
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
    signals.push('No text layer detected')
  }

  if (diagnostic.pdfPrecheck?.likelyScannedPdf === true) {
    signals.push('Likely scanned PDF')
  }

  if (diagnostic.pdfPrecheck?.isPasswordProtected === true) {
    signals.push('Password protection detected')
  }

  if (diagnostic.pdfPrecheck?.isCorrupted === true) {
    signals.push('File may be corrupted')
  }

  if (diagnostic.qualitySignals?.lowResolution === true) {
    signals.push('Low resolution')
  }

  if (diagnostic.qualitySignals?.blurDetected === true) {
    signals.push('Blur detected')
  }

  if (diagnostic.qualitySignals?.croppedPageDetected === true) {
    signals.push('Cropped page detected')
  }

  if (diagnostic.qualitySignals?.skewDetected === true) {
    signals.push('Page skew detected')
  }

  return signals
}
