export interface ApiError {
  status?: number;
  code: string;
  message: string;
  data?: unknown;
}
