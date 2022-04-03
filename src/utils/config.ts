import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const config: Config = JSON.parse(
  readFileSync(join(process.cwd(), 'config.json'), 'utf-8')
);

interface Config {
  port: number;
  secure: boolean;
  certificates?: {
    key: string;
    cert: string;
  };
}

export default config;
