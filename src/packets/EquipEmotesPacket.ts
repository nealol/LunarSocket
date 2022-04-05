import BufWrapper from '@minecraft-js/bufwrapper';

import Packet from './Packet';

export default class EquipEmotesPacket extends Packet<EquipEmotes> {
  public static id = 56;

  public constructor(buf?: BufWrapper) {
    super(buf);
  }

  public write(data: EquipEmotes): void {
    this.buf = new BufWrapper();
    this.buf.writeVarInt(EquipEmotesPacket.id); // Packet ID

    this.buf.writeVarInt(data.emotes.length);
    for (const emote of data.emotes) this.buf.writeVarInt(emote);
  }

  public read(): void {
    const emotesLength = this.buf.readVarInt();
    const emotes: number[] = [];
    for (let i = 0; i < emotesLength; i++) emotes.push(this.buf.readVarInt());

    this.data = {
      emotes,
    };
  }
}

interface EquipEmotes {
  emotes: number[];
}
