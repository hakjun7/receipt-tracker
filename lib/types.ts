export type ExtractedField = {
  key: string;
  type: string;
  value: string;
  confidence: number;
};

export type Receipt = {
  id: string;
  createdAt: string;
  imageDataUrl: string;
  rawFields: ExtractedField[];
  store: string;
  date: string;
  total: number;
  memo?: string;
};

export type ExtractResponse = {
  id?: string;
  model?: string;
  object?: string;
  choices?: Array<{
    index?: number;
    finish_reason?: string;
    message?: {
      role?: string;
      content?: string;
    };
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  [key: string]: unknown;
};
