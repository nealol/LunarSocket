import BufWrapper from '@minecraft-js/bufwrapper';

import Packet from './Packet';

export default class ConsoleCommand extends Packet<DoEmote> {
  public static id = 2;

  public constructor(buf?: BufWrapper) {
    super(buf);
  }

  public write(data: DoEmote): void {
    this.buf = new BufWrapper();
    this.buf.writeVarInt(ConsoleCommand.id); // Packet ID
    this.buf.writeString(data.command);
  }

  public read(): void {
    this.data = {
      command: this.buf.readString(),
    };
  }
}

interface DoEmote {
  command: string;
}
