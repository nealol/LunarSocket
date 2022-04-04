import { WebSocket } from 'ws';

import Packet from './packets/Packet';
import {
  IncomingPacketHandler,
  OutgoingPacketHandler,
} from './packets/PacketHandlers';
import logger from './utils/logger';
import GiveEmotesPacket from './packets/GiveEmotesPacket';
import { broadcast, connectedPlayers, removePlayer } from '.';
import PlayEmotePacket from './packets/PlayEmotePacket';

export default class Player {
  public version: string;
  public username: string;
  public uuid: string;
  public emotes: {
    owned: { owned: number[]; fake: number[] };
    equipped: { owned: number[]; fake: number[] };
  };

  private socket: WebSocket;
  private fakeSocket: WebSocket;
  private outgoingPacketHandler: OutgoingPacketHandler;
  private incomingPacketHandler: IncomingPacketHandler;

  public constructor(socket: WebSocket, handshake: Handshake) {
    this.version = handshake.version;
    this.username = handshake.username;
    this.uuid = handshake.playerId;
    this.emotes = {
      owned: { owned: [], fake: [56] },
      equipped: { owned: [], fake: [] },
    };

    this.socket = socket;
    this.fakeSocket = new WebSocket(
      'wss://assetserver.lunarclientprod.com/connect',
      {
        headers: { ...handshake },
      }
    );
    this.outgoingPacketHandler = new OutgoingPacketHandler(this);
    this.incomingPacketHandler = new IncomingPacketHandler(this);

    // Forwarding data
    this.socket.on('message', (data) => {
      // Trying to handle packet
      try {
        this.incomingPacketHandler.handle(data as Buffer);
      } catch (error) {
        logger.error(error);
        this.writeToServer(data);
      }
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

    // Handling disconnection and errors
    this.socket.on('close', () => {
      this.removePlayer();
    });
    this.fakeSocket.on('close', () => {
      this.removePlayer();
    });
    this.socket.on('error', (error) => {
      logger.error(error);
      this.removePlayer();
    });
    this.fakeSocket.on('error', (error) => {
      logger.error(error);
      this.removePlayer();
    });

    this.outgoingPacketHandler.on('giveEmotes', (packet) => {
      this.emotes.owned.owned = packet.data.owned;
      this.emotes.equipped.owned = packet.data.equipped;
      this.sendEmotes();
    });

    this.outgoingPacketHandler.on('playEmote', (packet) => {
      this.writeToClient(packet);
    });

    this.incomingPacketHandler.on('doEmote', (packet) => {
      if (
        this.emotes.owned.owned.includes(packet.data.id) ||
        packet.data.id === -1
      ) {
        // Player really owns this emote, playing on the real server
        this.writeToServer(packet);
      } else {
        // Player is using a fake emote, playing on the fake server
        this.playEmote(packet.data.id);
      }
    });
  }

  public sendEmotes(): void {
    const packet = new GiveEmotesPacket();
    const data = {
      owned: [...this.emotes.owned.owned, ...this.emotes.owned.fake],
      equipped: [...this.emotes.equipped.owned, ...this.emotes.equipped.fake],
    };
    packet.write(data);
    this.writeToClient(packet);
  }

  public playEmote(id: number) {
    const packet = new PlayEmotePacket();
    packet.write({ uuid: this.uuid, id });
    broadcast(packet);
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

  public removePlayer(): void {
    try {
      this.socket.close();
    } catch (error) {}
    try {
      this.fakeSocket.close();
    } catch (error) {}
    removePlayer(this.uuid);
  }
}

interface Handshake {
  accountType: string;
  arch: string;
  Authorization: string;
  branch: string;
  clothCloak: string;
  gitCommit: string;
  hatHeightOffset: string;
  hwid: string;
  launcherVersion: string;
  lunarPlusColor: string;
  os: string;
  playerId: string;
  protocolVersion: string;
  showHatsOverHelmet: string;
  showHatsOverSkinlayer: string;
  username: string;
  version: string;
}
