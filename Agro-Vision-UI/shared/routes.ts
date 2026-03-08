import { z } from 'zod';
import { insertAnalysisSchema, analyses } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  analyses: {
    analyze: {
      method: 'POST' as const,
      path: '/api/analyze' as const,
      // Input is FormData, not JSON, so we omit input schema for Zod body validation
      responses: {
        200: z.custom<typeof analyses.$inferSelect>(),
        400: errorSchemas.validation,
        500: errorSchemas.internal,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/analyses/:id' as const,
      responses: {
        200: z.custom<typeof analyses.$inferSelect>(),
        404: errorSchemas.internal,
      },
    }
  },
  audio: {
    speak: {
      method: 'POST' as const,
      path: '/api/speak' as const,
      input: z.object({
        text: z.string(),
        language: z.string(), // e.g. en-IN, hi-IN, pa-IN
      }),
      responses: {
        200: z.any(), // Returns audio buffer
      }
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
