/**
 * @author DEEP_DEV
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PATHS } from './config.js';

export function normalizeUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  const trimmed = rawUrl.trim();
  try {
    const parsed = new URL(trimmed);
    const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid'];
    for (const p of trackingParams) {
      parsed.searchParams.delete(p);
    }
    return parsed.toString();
  } catch {
    return trimmed;
  }
}

export function detectStreamType(url) {
  const lowercase = url.toLowerCase();
  if (lowercase.includes('.m3u8')) return 'hls';
  if (lowercase.includes('.mpd')) return 'dash';
  if (lowercase.includes('.ts')) return 'mpegts';
  if (lowercase.includes('.mp4')) return 'mp4';
  return 'hls';
}

export function normalizeChannels(importedItems) {
  const channelMap = new Map();
  const seenExactUrls = new Set();

  for (const item of importedItems) {
    const cleanUrl = normalizeUrl(item.streamUrl);
    if (!cleanUrl) continue;

    if (seenExactUrls.has(cleanUrl)) {
      continue;
    }
    seenExactUrls.add(cleanUrl);

    const channelId = (item.channelId || item.name || 'stream')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    if (!channelMap.has(channelId)) {
      channelMap.set(channelId, {
        id: channelId,
        name: item.name || 'Live Channel',
        country: item.country || 'INT',
        countryName: item.countryName || 'International',
        category: item.category || 'General',
        language: item.language || 'eng',
        languageName: item.languageName || 'English',
        logo: item.logo || '',
        epgId: item.epgId || channelId,
        streams: []
      });
    }

    const channel = channelMap.get(channelId);
    channel.streams.push({
      url: cleanUrl,
      type: detectStreamType(cleanUrl),
      status: 'pending',
      quality: item.quality || 'HD',
      httpReferrer: item.httpReferrer || '',
      userAgent: item.userAgent || '',
      last_checked: null
    });
  }

  return Array.from(channelMap.values());
}

export async function runNormalization() {
  const rawPath = path.join(PATHS.channelsDir, 'imported_raw.json');
  let rawData = [];
  try {
    const content = await fs.readFile(rawPath, 'utf-8');
    rawData = JSON.parse(content);
  } catch (err) {
    rawData = [];
  }

  const normalized = normalizeChannels(rawData);
  await fs.writeFile(PATHS.channelsJson, JSON.stringify(normalized, null, 2), 'utf-8');
  return normalized;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await runNormalization();
}
