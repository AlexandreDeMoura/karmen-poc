export type ExtractionStatus = 'success' | 'partial_success' | 'failed';

export interface DocumentDiagnostic {
  readonly documentId: string;
  readonly extractionStatus: ExtractionStatus;
  readonly source: 'mocked_document_pipeline';
  readonly pdfPrecheck?: {
    readonly hasTextLayer?: boolean;
    readonly likelyScannedPdf?: boolean;
    readonly isPasswordProtected?: boolean;
    readonly isCorrupted?: boolean;
  };
  readonly qualitySignals?: {
    readonly lowResolution?: boolean;
    readonly blurDetected?: boolean;
    readonly croppedPageDetected?: boolean;
    readonly skewDetected?: boolean;
  };
  readonly extractedFields?: {
    readonly detectedPeriodLabel?: string;
    readonly monthsCovered?: number;
    readonly bankName?: string;
    readonly fiscalYear?: number;
  };
}
