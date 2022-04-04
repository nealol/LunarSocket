import { EventEmitter } from 'node:events';
import TypedEventEmitter from 'typed-emitter';
import BufWrapper from '@minecraft-js/bufwrapper';

import Player from '../Player';
import logger from '../utils/logger';
import GiveEmotesPacket from './GiveEmotesPacket';
import PlayEmotePacket from './PlayEmotePacket';
import DoEmotePacket from './DoEmotePacket';

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
      logger.warn('Unknown packet id:', id);
      this.player.writeToClient(data);
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

const inboundPackets = [DoEmotePacket];
