import BufWrapper from '@minecraft-js/bufwrapper';

export default class Packet<T = any> {
  public buf: BufWrapper;
  public data: T;

  public constructor(buf?: BufWrapper) {
    this.buf = buf;
  }

  public write(data: T): void {}

  public read(): void {}
}
