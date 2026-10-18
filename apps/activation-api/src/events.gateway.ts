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
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`📡 Cliente WebSockets conectado: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`🔌 Cliente WebSockets desconectado: ${client.id}`);
  }

  emitEvent(activationId: string, event: any) {
    // 1. Emite al canal global 'activation.event' que escucha App.tsx
    this.server.emit('activation.event', event);

    // 2. Mantiene canales específicos por ID de activación por si los necesitas a futuro
    this.server.emit(`activation:${activationId}`, event);
  }
}