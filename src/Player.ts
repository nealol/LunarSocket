import { WebSocket } from 'ws';

import logger from './utils/logger';
import GiveEmotesPacket from './packets/GiveEmotesPacket';
import { broadcast } from '.';
import DoEmotePacket from './packets/DoEmotePacket';
import Packet from './packets/Packet';
import { OutgoingPacketHandler } from './packets/PacketHandlers';

export default class Player {
  public version: string;
  public username: string;
  public uuid: string;
  public emotes: { owned: number[]; fake: number[] };

  private socket: WebSocket;
  private fakeSocket: WebSocket;
  private outgoingPacketHandler: OutgoingPacketHandler;

  public constructor(socket: WebSocket, handshake: Handshake) {
    this.version = handshake.version;
    this.username = handshake.username;
    this.uuid = handshake.playerId;
    this.emotes = { owned: [], fake: [] };

    this.socket = socket;
    this.fakeSocket = new WebSocket(
      'wss://assetserver.lunarclientprod.com/connect',
      { headers: { ...handshake } }
    );
    this.outgoingPacketHandler = new OutgoingPacketHandler(this);

    // Forwarding data
    this.socket.on('message', (data) => {
      this.writeToServer(data);
    });

    this.fakeSocket.on('message', (data) => {
      // Trying to handle packet
      try {
        this.outgoingPacketHandler.handle(data as Buffer);
      } catch (error) {
        logger.error(error);
        this.writeToClient(data);
      }
    });

    this.outgoingPacketHandler.on('giveEmotes', (packet) => {
      console.log(packet);
    });

    this.outgoingPacketHandler.on('playEmote', (packet) => {
      console.log(packet);
    });
  }

  public writeToClient(data: any | Packet): void {
    if (data instanceof Packet) {
      this.socket.send(data.buf.buffer);
    } else this.socket.send(data);
  }

  public writeToServer(data: any | Packet): void {
    if (data instanceof Packet) {
      this.fakeSocket.send(data.buf.buffer);
    } else this.fakeSocket.send(data);
  }
}

interface Handshake {
  accountType: string;
  version: string;
  gitCommit: string;
  branch: string;
  os: string;
  arch: string;
  launcherVersion: string;
  username: string;
  playerId: string;
  Authorization: string;
  protocolVersion: string;
}
