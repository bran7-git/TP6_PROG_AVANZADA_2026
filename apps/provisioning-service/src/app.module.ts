import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ProvisioningController } from './provisioning.controller';
import { ProvisioningService } from './provisioning.service';
import { ProvisioningOrder, ProvisioningOrderSchema } from './schemas/provisioning-order.schema';
import { ProcessedEvent, ProcessedEventSchema } from './schemas/processed-event.schema';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost:27017/provisioning_db'),
    MongooseModule.forFeature([
      { name: ProvisioningOrder.name, schema: ProvisioningOrderSchema },
      { name: ProcessedEvent.name, schema: ProcessedEventSchema },
    ]),
    ClientsModule.register([
      {
        name: 'KAFKA_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'provisioning-service',
            brokers: ['localhost:9094'],
          },
          consumer: {
            groupId: 'provisioning-service-group',
          },
        },
      },
    ]),
  ],
  controllers: [ProvisioningController],
  providers: [ProvisioningService],
})
export class AppModule {}