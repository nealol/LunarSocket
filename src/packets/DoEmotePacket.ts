import BufWrapper from '@minecraft-js/bufwrapper';

import Packet from './Packet';

export default class DoEmotePacket extends Packet<DoEmote> {
  public static id = 39;

  public constructor(buf?: BufWrapper) {
    super(buf);
  }

  public write(data: DoEmote): void {
    this.buf = new BufWrapper();
    this.buf.writeVarint(DoEmotePacket.id); // Packet ID
    this.buf.writeInt(data.id);
  }

  public read(): void {
    this.data = {
      id: this.buf.readInt(),
    };
  }
}

interface DoEmote {
  id: number;
}
