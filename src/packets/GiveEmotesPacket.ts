import BufWrapper from '@minecraft-js/bufwrapper';

import Packet from './Packet';

export default class GiveEmotesPacket extends Packet<GiveEmotes> {
  public static id = 57;

  public constructor(buf?: BufWrapper) {
    super(buf);
  }

  public write(data: GiveEmotes): void {
    this.buf = new BufWrapper();
    this.buf.writeVarint(GiveEmotesPacket.id); // Packet ID

    this.buf.writeVarint(data.emotes.length);
    for (const ownedEmote of data.emotes) this.buf.writeVarint(ownedEmote);

    this.buf.writeVarint(data.b.length);
    for (const b of data.b) this.buf.writeVarint(b);
  }

  public read(): void {
    const emotesLength = this.buf.readVarint();
    const emotes: number[] = [];
    for (let i = 0; i < emotesLength; i++) emotes.push(this.buf.readVarint());

    const bLength = this.buf.readVarint();
    const b: number[] = [];
    for (let i = 0; i < bLength; i++) b.push(this.buf.readVarint());

    this.data = {
      emotes,
      b,
    };
  }
}

interface GiveEmotes {
  emotes: number[];
  b: number[];
}
