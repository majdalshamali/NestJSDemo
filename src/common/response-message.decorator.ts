import { SetMetadata } from '@nestjs/common';

export const RESPONSE_MESSAGE_KEY = 'response_message';

// Sets the "message" field ResponseInterceptor puts in the envelope for this
// route. Routes that skip it get the interceptor's own default ("success").
export const ResponseMessage = (message: string) =>
  SetMetadata(RESPONSE_MESSAGE_KEY, message);
