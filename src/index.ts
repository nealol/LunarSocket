import { Server, createServer } from 'node:https';
import { readFileSync } from 'node:fs';
import { Server as WebSocketServer } from 'ws';

import config from './utils/config';
import logger from './utils/logger';
import Player from './Player';

console.log(`   _____       _               _____            _        _   
  / ____|     | |             / ____|          | |      | |  
 | (___   ___ | | __ _ _ __  | (___   ___   ___| | _____| |_ 
  \\___ \\ / _ \\| |/ _\` | '__|  \\___ \\ / _ \\ / __| |/ / _ \\ __|
  ____) | (_) | | (_| | |     ____) | (_) | (__|   <  __/ |_ 
 |_____/ \\___/|_|\\__,_|_|    |_____/ \\___/ \\___|_|\\_\\___|\\__|\n`);

let httpsServer: Server;

if (config.secure) {
  httpsServer = createServer({
    cert: readFileSync(config.certificates.cert),
    key: readFileSync(config.certificates.key),
  });

  httpsServer.listen(config.port);
}

const server = new WebSocketServer({
  server: config.secure ? httpsServer : undefined,
  port: config.secure ? undefined : config.port,
  path: '/connect',
});

server.on('listening', () => {
  logger.log(`Server listening on port ${config.port}`);
});

server.on('connection', (socket, request) => {
  // logger.log(`New connection (addr=${request.socket.remoteAddress})`);

  const handshake = {
    accountType: request.headers['accounttype'] as string,
    arch: request.headers['arch'] as string,
    Authorization: request.headers['authorization'] as string,
    branch: request.headers['branch'] as string,
    clothCloak: request.headers['clothcloak'] as string,
    gitCommit: request.headers['gitcommit'] as string,
    hatHeightOffset: request.headers['hatheightoffset'] as string,
    hwid: request.headers['hwid'] as string,
    launcherVersion: request.headers['launcherversion'] as string,
    lunarPlusColor: request.headers['lunarpluscolor'] as string,
    os: request.headers['os'] as string,
    playerId: request.headers['playerid'] as string,
    protocolVersion: request.headers['protocolversion'] as string,
    showHatsOverHelmet: request.headers['showhatsoverhelmet'] as string,
    showHatsOverSkinlayer: request.headers['showhatsoverskinlayer'] as string,
    username: request.headers['username'] as string,
    version: request.headers['version'] as string,
  };

  // Ignoring players with older/newer protocol versions
  if (handshake.protocolVersion !== '5') return socket.close();

  // Closing the connection if the player is already connected
  if (connectedPlayers.find((p) => p.uuid === handshake.playerId))
    return socket.close();

  const player = new Player(socket, handshake);

  connectedPlayers.push(player);
});

export function broadcast(data: any): void {
  connectedPlayers.forEach((p) => p.writeToClient(data));
}

export function removePlayer(uuid: string): void {
  connectedPlayers = connectedPlayers.filter((p) => p.uuid !== uuid);
}

export let connectedPlayers: Player[] = [];
