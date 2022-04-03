import BufWrapper from '@minecraft-js/bufwrapper';

import DoEmotePacket from './DoEmotePacket';
import GiveEmotesPacket from './GiveEmotesPacket';
import Player from '../Player';
import logger from '../utils/logger';

export const packets = [DoEmotePacket, GiveEmotesPacket];

export default class PacketHandler {
  public player: Player;

  public constructor(player: Player) {
    this.player = player;
  }

  public handle(data: Buffer): void {
    const buf = new BufWrapper(data);

    const id = buf.readVarint();
    const Packet = packets.find((p) => p.id === id);

    if (!Packet) {
      logger.warn('Unknown packet id:', id);
      this.player.writeToClient(data);
    }

    const packet = new Packet(buf);
    packet.read();

    switch (Packet) {
      case GiveEmotesPacket:
        this.player.emotes.owned = (packet as GiveEmotesPacket).data.emotes;
        break;
      case DoEmotePacket:
        if (
          this.player.emotes.owned.includes((packet as DoEmotePacket).data.id)
        ) {
          // Player really has the emote, can send it to the server
          this.player.writeToServer(data);
        } else {
          // Player is doing a fake emote, ignoring it
        }
        break;
      default:
        break;
    }
  }
}
