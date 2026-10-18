import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as nodemailer from 'nodemailer';
import { Notification, NotificationDocument } from './schemas/notification.schema';
import { ProcessedEvent, ProcessedEventDocument } from './schemas/processed-event.schema';
import { EventEnvelope } from '@poc/contracts';

@Injectable()
export class NotificationService {
  private transporter: nodemailer.Transporter;

  constructor(
    @InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>,
    @InjectModel(ProcessedEvent.name) private processedEventModel: Model<ProcessedEventDocument>,
  ) {
    // Configuración de transporte hacia Mailhog
    this.transporter = nodemailer.createTransport({
      host: 'localhost',
      port: 1025,
      ignoreTLS: true,
    });
  }

  async handleActivationEvents(event: EventEnvelope) {
    // Idempotencia: Verificar si ya fue procesado
    const isDuplicate = await this.isEventProcessed(event.eventId);
    if (isDuplicate) {
      console.log(`[Notification] Evento duplicado ignorado: ${event.eventId}`);
      return;
    }

    const { correlationId, customerId, eventType, payload } = event;

    if (eventType === 'ActivationCompleted' || eventType === 'ActivationFailed') {
      await this.markEventProcessed(event.eventId, correlationId);

      const recipient = `${customerId.toLowerCase()}@example.com`;
      const isSuccess = eventType === 'ActivationCompleted';
      const subject = isSuccess
        ? `¡Tu servicio ha sido activado con éxito! (${correlationId})`
        : `Atención: Error en el proceso de activación (${correlationId})`;

      const body = isSuccess
        ? `Hola ${customerId},\n\nNos alegra informarte que tu solicitud de activación ${correlationId} finalizó correctamente.\n\n¡Gracias por elegirnos!`
        : `Hola ${customerId},\n\nLamentamos informarte que tu activación ${correlationId} ha fallado. Motivo: ${payload?.reason || 'Falló en servicios dependientes'}.\n\nSe han ejecutado las compensaciones necesarias.`;

      // 1. Guardar en MongoDB
      await this.notificationModel.create({
        activationId: correlationId,
        eventType,
        recipient,
        subject,
        body,
        status: 'SENT',
      });

      // 2. Enviar Email vía SMTP a Mailhog
      try {
        await this.transporter.sendMail({
          from: 'no-reply@telecom-poc.com',
          to: recipient,
          subject,
          text: body,
        });
        console.log(`📧 Email enviado exitosamente a Mailhog para ${recipient}`);
      } catch (err: any) {
        console.error(`❌ Error al enviar email a Mailhog:`, err?.message || err);
      }
    }
  }

  private async isEventProcessed(eventId: string): Promise<boolean> {
    const found = await this.processedEventModel.findOne({ eventId });
    return !!found;
  }

  private async markEventProcessed(eventId: string, correlationId: string) {
    try {
      await this.processedEventModel.create({ eventId, correlationId });
    } catch (e) {
      // Ignorar si por condición de carrera ya existía
    }
  }
}