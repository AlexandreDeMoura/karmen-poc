import { ApplicationDataService } from '../applications/application-data.service';
import { MockDocumentDiagnosticsService } from './mock-document-diagnostics.service';

describe('MockDocumentDiagnosticsService', () => {
  const applicationDataService = new ApplicationDataService();
  const service = new MockDocumentDiagnosticsService();

  it('returns the failed scanned-PDF diagnostic for d-012', () => {
    const application =
      applicationDataService.getApplicationByFinancingRequestId('fr-004');

    expect(application).toBeDefined();
    expect(service.getDiagnostics(application!)).toEqual([
      {
        documentId: 'd-012',
        extractionStatus: 'failed',
        source: 'mocked_document_pipeline',
        pdfPrecheck: {
          hasTextLayer: false,
          likelyScannedPdf: true,
        },
      },
    ]);
  });

  it('returns no diagnostics for applications without mocked scenarios', () => {
    const applications = applicationDataService
      .getApplications()
      .filter((application) => application.financing_request.id !== 'fr-004');

    applications.forEach((application) => {
      expect(service.getDiagnostics(application)).toEqual([]);
    });
  });

  it('returns diagnostics in source document order without mutating them', () => {
    const application =
      applicationDataService.getApplicationByFinancingRequestId('fr-004');

    expect(application).toBeDefined();
    const diagnostics = service.getDiagnostics(application!);

    expect(diagnostics.map(({ documentId }) => documentId)).toEqual(
      application!.documents
        .map(({ id }) => id)
        .filter((documentId) => documentId === 'd-012'),
    );
    expect(Object.isFrozen(diagnostics)).toBe(true);
    expect(Object.isFrozen(diagnostics[0])).toBe(true);
    expect(Object.isFrozen(diagnostics[0]?.pdfPrecheck)).toBe(true);
    expect(service.getDiagnostics(application!)[0]).toBe(diagnostics[0]);
  });
});
