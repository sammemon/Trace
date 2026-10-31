import { ConnectedSocket, MessageBody, OnGatewayConnection, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { ChatService } from './chat.service';

type SocketClaims = JwtPayload & { sub: string };

type AuthenticatedSocket = Socket & { userId?: string };

@Injectable()
@WebSocketGateway({ namespace: '/realtime', cors: { origin: process.env.ADMIN_ORIGIN ?? 'http://localhost:5173' } })
export class ChatGateway implements OnGatewayConnection {
  @WebSocketServer() server!: Server;

  constructor(private readonly chatService: ChatService) {}

  handleConnection(socket: AuthenticatedSocket) {
    try {
      const token = this.readToken(socket);
      const claims = jwt.verify(token, this.secret()) as SocketClaims;
      if (!claims.sub) throw new UnauthorizedException();
      socket.userId = claims.sub;
      void socket.join(`user:${claims.sub}`);
    } catch {
      socket.disconnect(true);
    }
  }

  @SubscribeMessage('conversation:join')
  async join(@ConnectedSocket() socket: AuthenticatedSocket, @MessageBody() body: { conversationId: string }) {
    if (!socket.userId) throw new UnauthorizedException();
    const messages = await this.chatService.messages(socket.userId, body.conversationId);
    await socket.join(`conversation:${body.conversationId}`);
    return { event: 'conversation:ready', data: { conversationId: body.conversationId, messages } };
  }

  @SubscribeMessage('message:send')
  async send(@ConnectedSocket() socket: AuthenticatedSocket, @MessageBody() body: { conversationId: string; body: string }) {
    if (!socket.userId) throw new UnauthorizedException();
    const message = await this.chatService.send(socket.userId, body.conversationId, { body: body.body });
    this.server.to(`conversation:${body.conversationId}`).emit('message:new', message);
    this.server.to(`user:${socket.userId}`).emit('message:sent', message);
    return { event: 'message:accepted', data: message };
  }

  @SubscribeMessage('typing:start')
  typingStart(@ConnectedSocket() socket: AuthenticatedSocket, @MessageBody() body: { conversationId: string }) {
    if (socket.userId) socket.to(`conversation:${body.conversationId}`).emit('typing:start', { userId: socket.userId });
  }

  @SubscribeMessage('typing:stop')
  typingStop(@ConnectedSocket() socket: AuthenticatedSocket, @MessageBody() body: { conversationId: string }) {
    if (socket.userId) socket.to(`conversation:${body.conversationId}`).emit('typing:stop', { userId: socket.userId });
  }

  private readToken(socket: Socket) {
    const auth = socket.handshake.auth as { token?: string };
    const header = socket.handshake.headers.authorization;
    const token = auth?.token ?? (header?.startsWith('Bearer ') ? header.slice(7) : undefined);
    if (!token) throw new UnauthorizedException('Realtime authentication required');
    return token;
  }

  private secret() {
    const secret = process.env.JWT_ACCESS_SECRET;
    if (!secret || secret.length < 32) throw new Error('JWT_ACCESS_SECRET must be at least 32 characters');
    return secret;
  }
}
