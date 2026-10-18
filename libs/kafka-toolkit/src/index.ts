export interface ProcessedEvent {
  eventId: string;
  processedAt: Date;
}

// Helper para reintentos exponenciales (1s, 2s, 4s) antes de enviar a la DLQ
export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delays = [1000, 2000, 4000],
): Promise<T> {
  let attempt = 0;
  while (attempt < retries) {
    try {
      return await fn();
    } catch (error) {
      attempt++;
      if (attempt >= retries) {
        throw error;
      }
      const delay = delays[attempt - 1] || 1000;
      await new Promise((res) => setTimeout(res, delay));
    }
  }
  throw new Error('Retries exhausted');
}