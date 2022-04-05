import BufWrapper from '@minecraft-js/bufwrapper';

import Packet from './Packet';

export default class ApplyCosmeticsPacket extends Packet<ApplyCosmetics> {
  public static id = 20;

  public constructor(buf?: BufWrapper) {
    super(buf);
  }

  public write(data: ApplyCosmetics): void {
    this.buf = new BufWrapper();
    this.buf.writeVarInt(ApplyCosmeticsPacket.id); // Packet ID

    this.buf.writeInt(data.cosmetics.length);
    for (const cosmetic of data.cosmetics) {
      this.buf.writeLong(cosmetic.id);
      this.buf.writeBoolean(cosmetic.equipped);
    }

    this.buf.writeBoolean(data.update);
  }

  public read(): void {
    const cosmeticsLength = this.buf.readInt();
    const cosmetics: Cosmetic[] = [];
    for (let i = 0; i < cosmeticsLength; i++) {
      cosmetics.push({
        // Returns a number and not a bigint because the `asBigInt` argument is not passed
        id: this.buf.readLong() as number,
        equipped: this.buf.readBoolean(),
      });
    }

    this.data = {
      cosmetics,
      update: this.buf.readBoolean(),
    };
  }
}

interface Cosmetic {
  id: number;
  equipped: boolean;
}

interface ApplyCosmetics {
  cosmetics: Cosmetic[];
  update: boolean;
}
