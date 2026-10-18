import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { BillingAccount, BillingAccountSchema } from './schemas/billing-account.schema';
import { ProcessedEvent, ProcessedEventSchema } from './schemas/processed-event.schema';

@Module({
  imports: [
    // Base de datos de billing en MongoDB
    MongooseModule.forRoot('mongodb://localhost:27017/billing_db'),
    MongooseModule.forFeature([
      { name: BillingAccount.name, schema: BillingAccountSchema },
      { name: ProcessedEvent.name, schema: ProcessedEventSchema },
    ]),

    // Conexión a Kafka
    ClientsModule.register([
      {
        name: 'KAFKA_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'billing-service',
            brokers: ['localhost:9094'], // Puerto externo para desarrollo local
          },
          consumer: {
            groupId: 'billing-service-group',
          },
        },
      },
    ]),
  ],
  controllers: [BillingController],
  providers: [BillingService],
})
export class AppModule {}