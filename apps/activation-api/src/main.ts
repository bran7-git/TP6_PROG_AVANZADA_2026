import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  // 1. Instancia HTTP para la API REST y WebSockets
  const app = await NestFactory.create(AppModule);
  
  // Habilitar CORS para que el frontend pueda conectarse
  app.enableCors({
    origin: '*',
  });

  // Configurar el prefijo global /api (resuelve el error 404 del frontend)
  app.setGlobalPrefix('api');

  // 2. Conectar la micro-arquitectura de Kafka
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: 'activation-api-server',
        brokers: ['localhost:9094'],
      },
      consumer: {
        groupId: 'activation-api-group',
        allowAutoTopicCreation: true,
      },
    },
  });

  await app.startAllMicroservices();
  await app.listen(3000);
  console.log('🚀 activation-api escuchando en http://localhost:3000/api/activations y eventos en Kafka...');
}
bootstrap();