export type ExtractionStatus = 'success' | 'partial_success' | 'failed';

export interface DocumentDiagnostic {
  documentId: string;
  extractionStatus: ExtractionStatus;
  source: 'mocked_document_pipeline';
  pdfPrecheck?: {
    hasTextLayer?: boolean;
    likelyScannedPdf?: boolean;
    isPasswordProtected?: boolean;
    isCorrupted?: boolean;
  };
  qualitySignals?: {
    lowResolution?: boolean;
    blurDetected?: boolean;
    croppedPageDetected?: boolean;
    skewDetected?: boolean;
  };
  extractedFields?: {
    detectedPeriodLabel?: string;
    monthsCovered?: number;
    bankName?: string;
    fiscalYear?: number;
  };
}
