import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: 'crm-analytics-service-server',
        brokers: ['localhost:9094'],
      },
      consumer: {
        groupId: 'crm-analytics-service-group',
      },
    },
  });

  await app.listen();
  console.log('🚀 crm-analytics-service escuchando eventos de Kafka...');
}
bootstrap();