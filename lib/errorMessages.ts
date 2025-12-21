// Centralized error messages for consistency

export const ERROR_MESSAGES = {
  // Drawing operations
  LOADING_DRAWING: 'Error loading drawing',
  SAVING_DRAWING: 'Error saving',
  DELETING_DRAWING: 'Error deleting',
  DRAWING_NOT_FOUND: 'Drawing not found',

  // Validation errors
  INVALID_DRAWING_ID: 'Invalid drawing ID',
  INVALID_TITLE: 'Invalid title. Title must be 1-200 characters.',
  INVALID_DRAWING_DATA: 'Invalid drawing data format',
  MISSING_DRAWING_FIELD: 'Missing required field: drawing',
  INVALID_JSON: 'Invalid JSON in request body',

  // Success messages
  SAVED: 'Saved!',
  DELETED: 'Drawing deleted',

  // Generic
  INTERNAL_ERROR: 'Internal server error',
  UNEXPECTED_ERROR: 'An unexpected error occurred',
} as const;

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return ERROR_MESSAGES.UNEXPECTED_ERROR;
}
