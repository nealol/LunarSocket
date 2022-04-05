import { WebSocket } from 'ws';

import Packet from './packets/Packet';
import {
  IncomingPacketHandler,
  OutgoingPacketHandler,
} from './packets/PacketHandlers';
import logger from './utils/logger';
import GiveEmotesPacket from './packets/GiveEmotesPacket';
import { broadcast, removePlayer } from '.';
import PlayEmotePacket from './packets/PlayEmotePacket';
import EquipEmotesPacket from './packets/EquipEmotesPacket';
import NotificationPacket from './packets/NotificationPacket';
import PlayerInfoPacket from './packets/PlayerInfoPacket';
import ApplyCosmeticsPacket from './packets/ApplyCosmeticsPacket';

export default class Player {
  public version: string;
  public username: string;
  public uuid: string;
  public server: string;
  public color: RealFake<number>;
  public premium: RealFake<boolean>;
  public clothCloak: RealFake<boolean>;
  public plusColor: RealFake<number>;

  public emotes: {
    owned: OwnedFake<number[]>;
    equipped: OwnedFake<number[]>;
  };
  public cosmetics: OwnedFake<{ id: number; equipped: boolean }[]>;

  private socket: WebSocket;
  private fakeSocket: WebSocket;
  private outgoingPacketHandler: OutgoingPacketHandler;
  private incomingPacketHandler: IncomingPacketHandler;

  public constructor(socket: WebSocket, handshake: Handshake) {
    this.version = handshake.version;
    this.username = handshake.username;
    this.uuid = handshake.playerId;
    this.server = '';
    this.premium = { real: false, fake: true };
    this.color = { real: 0, fake: 0xa83232 };
    this.clothCloak = { real: false, fake: true };
    this.plusColor = { real: 0, fake: 0x3295a8 };

    this.emotes = {
      owned: { owned: [], fake: [] },
      equipped: { owned: [], fake: [] },
    };
    this.cosmetics = {
      owned: [],
      fake: [],
    };

    this.socket = socket;
    this.fakeSocket = new WebSocket(
      'wss://assetserver.lunarclientprod.com/connect',
      {
        headers: { ...handshake },
      }
    );
    this.outgoingPacketHandler = new OutgoingPacketHandler(this);
    this.incomingPacketHandler = new IncomingPacketHandler(this);

    // Yes, we are giving emotes out of nowhere
    for (let i = 0; i < 150; i++) this.emotes.owned.fake.push(i);

    // Yes, wea re giving cosmetics out of nowhere again
    for (let i = 0; i < 15; i++)
      this.cosmetics.fake.push({ id: i, equipped: false });

    // Forwarding data
    this.socket.on('message', (data) => {
      // Trying to handle packet
      try {
        this.incomingPacketHandler.handle(data as Buffer);
      } catch (error) {
        logger.error(error);
        this.writeToServer(data);
      }
    });

    this.fakeSocket.on('message', (data) => {
      // Trying to handle packet
      try {
        this.outgoingPacketHandler.handle(data as Buffer);
      } catch (error) {
        logger.error(error);
        this.writeToClient(data);
      }
    });

    // Handling disconnection and errors
    this.socket.on('close', () => {
      this.removePlayer();
    });
    this.fakeSocket.on('close', () => {
      this.removePlayer();
    });
    this.socket.on('error', (error) => {
      logger.error(error);
      this.removePlayer();
    });
    this.fakeSocket.on('error', (error) => {
      logger.error(error);
      this.removePlayer();
    });

    this.outgoingPacketHandler.on('giveEmotes', (packet) => {
      this.emotes.owned.owned = packet.data.owned;
      this.emotes.equipped.owned = packet.data.equipped;
      this.sendEmotes();
    });

    this.outgoingPacketHandler.on('playEmote', (packet) => {
      this.writeToClient(packet);
    });

    this.outgoingPacketHandler.on('notification', (packet) => {
      this.writeToClient(packet);
    });

    this.outgoingPacketHandler.on('playerInfo', (packet) => {
      if (packet.data.uuid === this.uuid) {
        // Player info for this player
        this.cosmetics.owned = packet.data.cosmetics;
        // Removing the owned cosmetics from the fake list
        this.cosmetics.fake = this.cosmetics.fake.filter(
          (c) => !this.cosmetics.owned.find((o) => o.id === c.id)
        );
        this.premium.real = packet.data.premium;
        this.color.real = packet.data.color;
        this.clothCloak.real = packet.data.clothCloak;
        this.plusColor.real = packet.data.plusColor;

        // Sending the owned and fake cosmetics to the client
        const newPacket = new PlayerInfoPacket();
        newPacket.write({
          ...packet.data,
          cosmetics: [...this.cosmetics.fake, ...this.cosmetics.owned],
          premium: this.premium.fake,
          color: this.color.fake,
          clothCloak: this.clothCloak.fake,
          plusColor: this.plusColor.fake,
        });
        return this.writeToClient(newPacket);
      }
      this.writeToClient(packet);
    });

    this.incomingPacketHandler.on('doEmote', (packet) => {
      if (
        this.emotes.owned.owned.includes(packet.data.id) ||
        packet.data.id === -1 // -1 is when you cancel/finish the emote
      ) {
        // Player really owns this emote, playing on the real server
        this.writeToServer(packet);
      } else {
        // Player is using a fake emote, playing on the fake server
        this.playEmote(packet.data.id);
      }
    });

    this.incomingPacketHandler.on('joinServer', (packet) => {
      this.server = packet.data.ip;
      this.writeToServer(packet);
    });

    this.incomingPacketHandler.on('equipEmotes', (packet) => {
      const owned: number[] = [];
      const fake: number[] = [];
      packet.data.emotes.forEach((emote) => {
        if (this.emotes.owned.owned.includes(emote)) {
          // Player really has the emote, making sure it's in the owned list
          owned.push(emote);
        } else {
          // Player doesn't have the emote, making sure it's in the fake list
          fake.push(emote);
        }

        // Sending the owned emote list to the server
        const packet = new EquipEmotesPacket();
        packet.write({ emotes: owned });
        this.writeToServer(packet);
      });
    });

    this.incomingPacketHandler.on('applyCosmetics', (packet) => {
      for (const cosmetic of packet.data.cosmetics) {
        this.setCosmeticState(cosmetic.id, cosmetic.equipped);
      }

      // Sending the new state of the cosmetics to lunar
      const _packet = new ApplyCosmeticsPacket();
      _packet.write({
        cosmetics: this.cosmetics.owned,
        update: packet.data.update,
      });
    });

    // After every listeners are registered sending a hi notification
    setTimeout(() => {
      const notification = new NotificationPacket();
      notification.write({
        title: '',
        message: 'Never gonna give you up :D',
      });
      this.writeToClient(notification);
    }, 1000);
  }

  public setCosmeticState(id: number, state: boolean): void {
    const owned = this.cosmetics.owned.find((c) => c.id === id);
    if (owned) {
      owned.equipped = state;
      return;
    }
    const fake = this.cosmetics.fake.find((c) => c.id === id);
    if (fake) {
      fake.equipped = state;
      return;
    }
  }

  public sendEmotes(): void {
    const packet = new GiveEmotesPacket();
    const data = {
      owned: [...this.emotes.owned.owned, ...this.emotes.owned.fake],
      equipped: [...this.emotes.equipped.owned, ...this.emotes.equipped.fake],
    };
    packet.write(data);
    this.writeToClient(packet);
  }

  public playEmote(id: number) {
    const packet = new PlayEmotePacket();
    packet.write({ uuid: this.uuid, id });
    broadcast(packet, this.server); // Sending only to people who are on the same server
  }

  public writeToClient(data: any | Packet): void {
    try {
      if (data instanceof Packet) {
        this.socket.send(data.buf.buffer);
      } else this.socket.send(data);
    } catch (error) {
      logger.error('Error writing to client:', error.message);
    }
  }

  public writeToServer(data: any | Packet): void {
    try {
      if (data instanceof Packet) {
        this.fakeSocket.send(data.buf.buffer);
      } else this.fakeSocket.send(data);
    } catch (error) {
      logger.error('Error writing to server:', error.message);
    }
  }

  public removePlayer(): void {
    try {
      this.socket.close();
    } catch (error) {}
    try {
      this.fakeSocket.close();
    } catch (error) {}
    removePlayer(this.uuid);
  }
}

interface Handshake {
  accountType: string;
  arch: string;
  Authorization: string;
  branch: string;
  clothCloak: string;
  gitCommit: string;
  hatHeightOffset: string;
  hwid: string;
  launcherVersion: string;
  lunarPlusColor: string;
  os: string;
  playerId: string;
  protocolVersion: string;
  showHatsOverHelmet: string;
  showHatsOverSkinlayer: string;
  username: string;
  version: string;
}

type RealFake<T> = { real: T; fake: T };
type OwnedFake<T> = { owned: T; fake: T };
