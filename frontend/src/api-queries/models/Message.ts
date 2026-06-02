export interface Message {
  id: string;
  sessionId: string;
  role: "user" | "assistant";
  content: string;
  inputTokens: null | number;
  outputTokens: null | number;
  totalTokens: null | number;
  createdAt: string;
  updatedAt?: string;
}
