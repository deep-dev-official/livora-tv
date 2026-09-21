/**
 * @author DEEP_DEV
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const ROOT_DIR = path.resolve(__dirname, '..');

export const PATHS = {
  root: ROOT_DIR,
  channelsDir: path.join(ROOT_DIR, 'channels'),
  channelsJson: path.join(ROOT_DIR, 'channels', 'channels.json'),
  streamsDir: path.join(ROOT_DIR, 'streams'),
  activeStreamsJson: path.join(ROOT_DIR, 'streams', 'active.json'),
  inactiveStreamsJson: path.join(ROOT_DIR, 'streams', 'inactive.json'),
  statusJson: path.join(ROOT_DIR, 'streams', 'status.json'),
  playlistsDir: path.join(ROOT_DIR, 'playlists'),
  indexM3u: path.join(ROOT_DIR, 'playlists', 'index.m3u'),
  allM3u: path.join(ROOT_DIR, 'playlists', 'all.m3u'),
  webDir: path.join(ROOT_DIR, 'web'),
  statsJson: path.join(ROOT_DIR, 'web', 'stats.json'),
  epgDir: path.join(ROOT_DIR, 'epg')
};

export const SOURCES = {
  iptvOrg: {
    channels: 'https://iptv-org.github.io/api/channels.json',
    streams: 'https://iptv-org.github.io/api/streams.json',
    feeds: 'https://iptv-org.github.io/api/feeds.json',
    logos: 'https://iptv-org.github.io/api/logos.json',
    categories: 'https://iptv-org.github.io/api/categories.json',
    languages: 'https://iptv-org.github.io/api/languages.json',
    countries: 'https://iptv-org.github.io/api/countries.json'
  }
};

export const VALIDATION_CONFIG = {
  concurrency: 16,
  timeoutMs: 8000,
  maxRetries: 2,
  retryDelayMs: 600,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 LivoraTV/1.0',
  sampleLimitPerCountry: 50
};

export const TARGET_COUNTRIES = [
  'IN', 'BD', 'US', 'GB', 'CA', 'AU', 'PK', 'AE', 'SA', 'DE', 'FR'
];
