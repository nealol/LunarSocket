import BufWrapper from '@minecraft-js/bufwrapper';

import Packet from './Packet';

export default class NotificationPacket extends Packet<Notification> {
  public static id = 3;

  public constructor(buf?: BufWrapper) {
    super(buf);
  }

  public write(data: Notification): void {
    this.buf = new BufWrapper();
    this.buf.writeVarInt(NotificationPacket.id); // Packet ID

    this.buf.writeString(data.title);
    this.buf.writeString(data.message);
  }

  public read(): void {
    this.data = {
      title: this.buf.readString(),
      message: this.buf.readString(),
    };
  }
}

interface Notification {
  title: string;
  message: string;
}
