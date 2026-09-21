/**
 * @author DEEP_DEV
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PATHS } from './config.js';

export function sanitizeSlug(str) {
  if (!str) return 'unknown';
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function buildM3uEntry(channel, stream) {
  const tvgId = channel.epgId || channel.id || '';
  const tvgName = channel.name || '';
  const logo = channel.logo || '';
  const group = channel.category || channel.countryName || 'Livora TV';
  const label = stream.quality && !stream.quality.includes('undefined')
    ? `${channel.name} (${stream.quality})`
    : channel.name;

  return [
    `#EXTINF:-1 tvg-id="${tvgId}" tvg-name="${tvgName}" tvg-logo="${logo}" group-title="${group}",${label}`,
    stream.url
  ].join('\n');
}

export function createM3uHeader() {
  return '#EXTM3U x-tvg-url="https://deep-dev-official.github.io/livora-tv/epg/epg.xml.gz"\n';
}

export async function generatePlaylists() {
  await fs.mkdir(PATHS.playlistsDir, { recursive: true });
  await fs.mkdir(PATHS.webDir, { recursive: true });
  await fs.mkdir(PATHS.channelsDir, { recursive: true });

  let channels = [];
  try {
    const raw = await fs.readFile(PATHS.channelsJson, 'utf-8');
    channels = JSON.parse(raw);
  } catch {
    channels = [];
  }

  const activeChannels = [];
  const countryMap = new Map();
  const languageMap = new Map();
  const categoryMap = new Map();

  let totalActiveStreams = 0;
  const masterLines = [createM3uHeader()];

  for (const channel of channels) {
    const validStreams = (channel.streams || []).filter(s => s.status !== 'inactive' && s.status !== 'not_found' && s.status !== 'forbidden');
    if (validStreams.length === 0) continue;

    validStreams.sort((a, b) => (a.status === 'active' ? -1 : 1));

    totalActiveStreams += validStreams.length;
    const channelCopy = { ...channel, streams: validStreams };
    activeChannels.push(channelCopy);

    for (const stream of validStreams) {
      const entry = buildM3uEntry(channel, stream);
      masterLines.push(entry);

      const countrySlug = sanitizeSlug(channel.countryName || channel.country);
      if (!countryMap.has(countrySlug)) {
        countryMap.set(countrySlug, { name: channel.countryName || channel.country, channels: [], lines: [createM3uHeader()] });
      }
      countryMap.get(countrySlug).lines.push(entry);
      countryMap.get(countrySlug).channels.push(channelCopy);

      const langSlug = sanitizeSlug(channel.languageName || channel.language);
      if (!languageMap.has(langSlug)) {
        languageMap.set(langSlug, { name: channel.languageName || channel.language, lines: [createM3uHeader()] });
      }
      languageMap.get(langSlug).lines.push(entry);

      const catSlug = sanitizeSlug(channel.category);
      if (!categoryMap.has(catSlug)) {
        categoryMap.set(catSlug, { name: channel.category, lines: [createM3uHeader()] });
      }
      categoryMap.get(catSlug).lines.push(entry);
    }
  }

  const masterM3uContent = masterLines.join('\n\n') + '\n';
  await fs.writeFile(PATHS.indexM3u, masterM3uContent, 'utf-8');
  await fs.writeFile(PATHS.allM3u, masterM3uContent, 'utf-8');

  for (const [slug, data] of countryMap.entries()) {
    const filePath = path.join(PATHS.playlistsDir, `${slug}.m3u`);
    await fs.writeFile(filePath, data.lines.join('\n\n') + '\n', 'utf-8');

    const jsonPath = path.join(PATHS.channelsDir, `${slug}.json`);
    await fs.writeFile(jsonPath, JSON.stringify(data.channels, null, 2), 'utf-8');
  }

  for (const [slug, data] of languageMap.entries()) {
    const filePath = path.join(PATHS.playlistsDir, `${slug}.m3u`);
    await fs.writeFile(filePath, data.lines.join('\n\n') + '\n', 'utf-8');
  }

  for (const [slug, data] of categoryMap.entries()) {
    const filePath = path.join(PATHS.playlistsDir, `${slug}.m3u`);
    await fs.writeFile(filePath, data.lines.join('\n\n') + '\n', 'utf-8');
  }

  const countryStats = {};
  for (const [slug, data] of countryMap.entries()) {
    countryStats[data.name] = data.channels.length;
  }

  const categoryStats = {};
  for (const [slug, data] of categoryMap.entries()) {
    categoryStats[data.name] = data.lines.length - 1;
  }

  const stats = {
    platform: 'Livora TV',
    total_channels: activeChannels.length,
    total_active_streams: totalActiveStreams,
    total_monitored_channels: channels.length,
    total_countries: countryMap.size,
    total_languages: languageMap.size,
    total_categories: categoryMap.size,
    last_updated: new Date().toISOString(),
    country_breakdown: countryStats,
    category_breakdown: categoryStats,
    available_playlists: {
      master: 'playlists/index.m3u',
      all: 'playlists/all.m3u',
      countries: Array.from(countryMap.keys()).map(k => `playlists/${k}.m3u`),
      languages: Array.from(languageMap.keys()).map(k => `playlists/${k}.m3u`),
      categories: Array.from(categoryMap.keys()).map(k => `playlists/${k}.m3u`)
    }
  };

  await fs.writeFile(PATHS.statsJson, JSON.stringify(stats, null, 2), 'utf-8');
  await fs.writeFile(path.join(PATHS.root, 'stats.json'), JSON.stringify(stats, null, 2), 'utf-8');

  return stats;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await generatePlaylists();
}
