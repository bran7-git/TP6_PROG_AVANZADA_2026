import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ActivationController } from './activation.controller';
import { ActivationService } from './activation.service';
import { EventsGateway } from './events.gateway';
import { Activation, ActivationSchema } from './schemas/activation.schema';
import { ActivationGateway } from './activation.gateway';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost:27017/activation_db'),
    MongooseModule.forFeature([{ name: Activation.name, schema: ActivationSchema }]),
    ClientsModule.register([
      {
        name: 'KAFKA_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'activation-api',
            brokers: ['localhost:9094'], // Apunta al puerto externo 9094
          },
          consumer: {
            groupId: 'activation-api-consumer',
          },
        },
      },
    ]),
  ],
  controllers: [ActivationController],
  providers: [ActivationService, EventsGateway, ActivationGateway],
})
export class AppModule {}