import { Server, createServer } from 'node:https';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
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
    cert: readFileSync(join(process.cwd(), 'certificates', 'public.cert')),
    key: readFileSync(join(process.cwd(), 'certificates', 'private.key')),
  });

  httpsServer.listen(config.port);
}

const server = new WebSocketServer({
  server: config.secure ? httpsServer : undefined,
  port: config.secure ? undefined : config.port,
});

server.on('listening', () => {
  logger.log(`Server listening on port ${config.port}`);
});

server.on('connection', (socket, request) => {
  const handshake = {
    accountType: request.headers['accountType'] as string,
    version: request.headers['version'] as string,
    gitCommit: request.headers['gitCommit'] as string,
    branch: request.headers['branch'] as string,
    os: request.headers['os'] as string,
    arch: request.headers['arch'] as string,
    launcherVersion: request.headers['launcherVersion'] as string,
    username: request.headers['username'] as string,
    playerId: request.headers['playerId'] as string,
    Authorization: request.headers['Authorization'] as string,
    protocolVersion: request.headers['protocolVersion'] as string,
  };

  // Closing the connection if the player is already connected
  if (connectedPlayers.find((p) => p.uuid === handshake.playerId))
    return socket.close();

  const player = new Player(socket, handshake);

  connectedPlayers.push(player);
});

export function broadcast(data: any): void {
  connectedPlayers.forEach((p) => p.writeToClient(data));
}

export const connectedPlayers: Player[] = [];
