export interface GenerateEmailPreviewRequest {
  selectedProblemIds: string[];
}

export interface EmailPreview {
  subject: string;
  body: string;
  includedProblemIds: string[];
}
