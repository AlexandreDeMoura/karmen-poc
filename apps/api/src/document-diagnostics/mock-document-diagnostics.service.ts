import { Injectable } from '@nestjs/common';
import type { Application } from '../applications/application.types';
import type { DocumentDiagnostic } from './document-diagnostic.types';

const D012_DIAGNOSTIC: Readonly<DocumentDiagnostic> = Object.freeze({
  documentId: 'd-012',
  extractionStatus: 'failed',
  source: 'mocked_document_pipeline',
  pdfPrecheck: Object.freeze({
    hasTextLayer: false,
    likelyScannedPdf: true,
  }),
});

const DIAGNOSTIC_BY_DOCUMENT_ID: ReadonlyMap<
  string,
  Readonly<DocumentDiagnostic>
> = new Map([['d-012', D012_DIAGNOSTIC]]);

@Injectable()
export class MockDocumentDiagnosticsService {
  getDiagnostics(
    application: Application,
  ): readonly Readonly<DocumentDiagnostic>[] {
    const diagnostics = application.documents.flatMap((document) => {
      const diagnostic = DIAGNOSTIC_BY_DOCUMENT_ID.get(document.id);
      return diagnostic ? [diagnostic] : [];
    });

    return Object.freeze(diagnostics);
  }
}
