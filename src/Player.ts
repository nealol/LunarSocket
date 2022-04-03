import { WebSocket } from 'ws';

import PacketHandler from './packets/handlePacket';
import logger from './utils/logger';
import GiveEmotesPacket from './packets/GiveEmotesPacket';
import { broadcast } from '.';
import DoEmotePacket from './packets/DoEmotePacket';
import Packet from './packets/Packet';

export default class Player {
  public version: string;
  public username: string;
  public uuid: string;
  public emotes: { owned: number[]; fake: number[] };

  private socket: WebSocket;
  private fakeSocket: WebSocket;
  private packetHandler: PacketHandler;

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
    this.packetHandler = new PacketHandler(this);

    // Forwarding data
    this.socket.on('message', (data) => {
      this.writeToServer(data);
    });

    this.fakeSocket.on('message', (data) => {
      // Trying to handle packet
      try {
        this.packetHandler.handle(data as Buffer);
      } catch (error) {
        logger.error(error);
        this.writeToClient(data);
      }
    });
  }

  public sendEmotes(): void {
    const packet = new GiveEmotesPacket();
    packet.write({
      emotes: [...this.emotes.owned, ...this.emotes.fake],
      b: [],
    });
  }

  public doEmote(emote: number): void {
    const packet = new DoEmotePacket();
    packet.write({
      id: emote,
    });
    broadcast(packet.buf.buffer);
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
