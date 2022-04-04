import BufWrapper from '@minecraft-js/bufwrapper';

import Packet from './Packet';

export default class PlayEmotePacket extends Packet<PlayEmote> {
  public static id = 51;

  public constructor(buf?: BufWrapper) {
    super(buf);
  }

  public write(data: PlayEmote): void {
    this.buf = new BufWrapper();
    this.buf.writeVarInt(PlayEmotePacket.id); // Packet ID
    this.buf.writeUUID(data.uuid);
    this.buf.writeInt(data.id);
  }

  public read(): void {
    this.data = {
      uuid: this.buf.readUUID(),
      id: this.buf.readInt(),
    };
  }
}

interface PlayEmote {
  uuid: string;
  id: number;
}
