import { EventEmitter } from 'node:events';
import TypedEventEmitter from 'typed-emitter';
import BufWrapper from '@minecraft-js/bufwrapper';

import Player from '../Player';
import logger from '../utils/logger';
import GiveEmotesPacket from './GiveEmotesPacket';
import PlayEmotePacket from './PlayEmotePacket';
import DoEmotePacket from './DoEmotePacket';
import ConsoleCommand from './ConsoleCommand';

// Outgoing is when a packet is sent by the server to the client
export class OutgoingPacketHandler extends (EventEmitter as new () => TypedEventEmitter<OutgoingPacketHandlerEvents>) {
  private player: Player;

  public constructor(player: Player) {
    super();
    this.player = player;
  }

  public handle(data: Buffer): void {
    const buf = new BufWrapper(data);

    const id = buf.readVarInt();
    const Packet = outboundPackets.find((p) => p.id === id);

    if (!Packet) {
      // logger.warn('Unknown packet id (outgoing):', id);
      return this.player.writeToClient(data);
    }

    const packet = new Packet(buf);
    packet.read();

    // There's probably a better way to do this
    if (packet instanceof GiveEmotesPacket) {
      this.emit('giveEmotes', packet);
    }
    if (packet instanceof PlayEmotePacket) {
      this.emit('playEmote', packet);
    }
  }
}

const outboundPackets = [GiveEmotesPacket, PlayEmotePacket];

type OutgoingPacketHandlerEvents = {
  giveEmotes: (packet: GiveEmotesPacket) => void;
  playEmote: (packet: PlayEmotePacket) => void;
};

// Incoming is when a packet is sent by the client to the server
export class IncomingPacketHandler extends (EventEmitter as new () => TypedEventEmitter<IncomingPacketHandlerEvents>) {
  private player: Player;

  public constructor(player: Player) {
    super();
    this.player = player;
  }

  public handle(data: Buffer): void {
    const buf = new BufWrapper(data);

    const id = buf.readVarInt();
    const Packet = inboundPackets.find((p) => p.id === id);

    if (!Packet) {
      logger.warn('Unknown packet id (incoming):', id);
      return this.player.writeToServer(data);
    }

    const packet = new Packet(buf);
    packet.read();

    // There's probably a better way to do this
    if (packet instanceof DoEmotePacket) {
      this.emit('doEmote', packet);
    }
    if (packet instanceof ConsoleCommand) {
      this.emit('consoleCommand', packet);
    }
  }
}

type IncomingPacketHandlerEvents = {
  doEmote: (packet: DoEmotePacket) => void;
  consoleCommand: (packet: ConsoleCommand) => void;
};

const inboundPackets = [DoEmotePacket, ConsoleCommand];
