import axios from 'axios';
import type { ApiError } from './types';

const messages: Record<number, string> = {
  400: 'The request is invalid.',
  402: 'Your restaurant subscription has expired.',
  401: 'Please sign in again.',
  403: 'You do not have permission for this action.',
  404: 'The requested resource was not found.',
  409: 'The request conflicts with the current data.',
  422: 'Please check the submitted information.',
  429: 'Too many requests. Please try again later.',
};

export function normalizeApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    let code = error.code ?? 'REQUEST_FAILED';
    let message = 'The request could not be completed.';
    if (code === 'ERR_CANCELED') message = 'The request was canceled.';
    else if (code === 'ECONNABORTED' || code === 'ETIMEDOUT') {
      code = 'TIMEOUT';
      message = 'The request timed out. Please try again.';
    } else if (!error.response) {
      code = 'NETWORK_UNAVAILABLE';
      message = 'Unable to connect. Please check your connection.';
    } else if (status && status >= 500) {
      message = 'The server is unavailable. Please try again later.';
    } else if (status) message = messages[status] ?? message;
    const body = error.response?.data;
    if (
      status &&
      status < 500 &&
      body?.success === false &&
      typeof body.error?.code === 'string'
    ) {
      code = body.error.code;
      if (
        typeof body.error.message === 'string' &&
        body.error.message.length <= 1000
      )
        message = body.error.message;
    }
    return { status, code, message, data: body };
  }
  if (
    error &&
    typeof error === 'object' &&
    'code' in error &&
    'message' in error &&
    typeof error.code === 'string' &&
    typeof error.message === 'string'
  ) {
    return error as ApiError;
  }
  return {
    code: 'UNKNOWN',
    message:
      error instanceof Error
        ? error.message
        : 'The request could not be completed.',
  };
}
