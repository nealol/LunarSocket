import BufWrapper from '@minecraft-js/bufwrapper';

import Packet from './Packet';

export default class JoinServerPacket extends Packet<JoinServer> {
  public static id = 6;

  public constructor(buf?: BufWrapper) {
    super(buf);
  }

  public write(data: JoinServer): void {
    this.buf = new BufWrapper();
    this.buf.writeVarInt(JoinServerPacket.id); // Packet ID

    this.buf.writeBytes([0x00]); // Don't ask me why I don't fucking know yet
    this.buf.writeString(data.ip);
  }

  public read(): void {
    this.buf.readBytes(1); // Same here
    this.data = {
      ip: this.buf.readString(),
    };
  }
}

interface JoinServer {
  ip: string;
}
