export class ZoomError extends Error {
  code?: string | number;
  
  constructor(message: string, code?: string | number) {
    super(message);
    this.name = 'ZoomError';
    this.code = code;
  }
}

export const handleZoomError = (error: any): ZoomError => {
  // Common Zoom error codes and their user-friendly messages
  const errorMessages: Record<string, string> = {
    'INVALID_TOKEN': 'The session token is invalid or has expired',
    'SESSION_JOIN_FAILED': 'Failed to join the Zoom session',
    'MEDIA_NO_PERMISSION': 'Please allow camera and microphone permissions',
    'DEVICE_NOT_FOUND': 'No camera or microphone found',
    'NETWORK_ERROR': 'Network connection error',
    'INVALID_PARAMETERS': 'Invalid session parameters',
    'AUDIO_ALREADY_IN_PROGRESS': 'Audio is already being processed',
    'VIDEO_ALREADY_IN_PROGRESS': 'Video is already being processed',
    'PERMISSION_DENIED': 'Camera or microphone permission denied',
    'DEVICE_IN_USE': 'Camera or microphone is being used by another application',
  };

  console.log('Raw Zoom Error:', error); // Debug log

  let message = 'An error occurred with the Zoom session';
  let code = 'UNKNOWN_ERROR';

  if (error instanceof Error) {
    message = error.message;
    if ('code' in error) {
      code = (error as any).code;
    }
  } else if (typeof error === 'string') {
    message = error;
  } else if (error && typeof error === 'object') {
    // Handle object-type errors
    if ('message' in error) message = String(error.message);
    if ('code' in error) code = String(error.code);
    if ('name' in error) {
      message = `${error.name}: ${message}`;
    }
    // If the error object has a toString method, use it as fallback
    if (message === '[object Object]' && error.toString) {
      message = error.toString();
    }
  }

  // Use predefined message if available
  if (code in errorMessages) {
    message = errorMessages[code];
  }

  console.log('Processed Error:', { message, code }); // Debug log
  return new ZoomError(message, code);
}; 