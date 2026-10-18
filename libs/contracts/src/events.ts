// 1. Sobre Común (Envelope) para todos los eventos
export interface EventEnvelope<T = any> {
  eventId: string;             // Base de la idempotencia
  eventType: string;           // Ejemplo: ActivationRequested
  version: number;             // Versión del contrato
  occurredAt: string;          // Timestamp ISO
  correlationId: string;       // ID de la activación (act-XXXX)
  customerId: string;          // Clave de partición en Kafka (orden por cliente)
  source: string;              // Servicio emisor
  payload: T;
}

// 2. Modos de fallo simulados
export type SimulateFailureMode = 'none' | 'billing' | 'provisioning';

// 3. Payloads específicos
export interface ActivationRequestedPayload {
  planId: string;
  channel: string;
  simulateFailure: SimulateFailureMode;
}

export interface BillingAccountCreatedPayload {
  accountId: string;
  amount: number;
}

export interface BillingFailedPayload {
  reason: string;
}

export interface BillingAccountCancelledPayload {
  accountId: string;
  reason: string;
}

export interface ProvisioningCompletedPayload {
  provisioningId: string;
}

export interface ProvisioningFailedPayload {
  reason: string;
}

export interface ActivationCompletedPayload {
  status: 'ACTIVE';
  completedAt: string;
}

export interface ActivationFailedPayload {
  status: 'FAILED';
  failedAt: string;
  reason: string;
}

// 4. Nombres de Topics de Kafka
export const TOPICS = {
  ACTIVATION_REQUESTED: 'activation.requested',
  BILLING_EVENTS: 'billing.events',
  PROVISIONING_EVENTS: 'provisioning.events',
  ACTIVATION_EVENTS: 'activation.events',
} as const;