import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ActivationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`📡 Cliente WebSockets conectado: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`🔌 Cliente WebSockets desconectado: ${client.id}`);
  }

  emitActivationEvent(event: any) {
    // Reemite el evento de Kafka hacia el frontend en el canal 'activation.event'
    this.server.emit('activation.event', event);
  }
}