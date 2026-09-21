/**
 * @author DEEP_DEV
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { PATHS, VALIDATION_CONFIG } from './config.js';
import { validateStreamUrl } from './validate.js';
import { generatePlaylists } from './generate.js';
import { generateReport } from './report.js';

const M3U_SOURCES = [
  {
    name: 'Bangla / Bangladesh',
    url: 'https://raw.githubusercontent.com/imdhiru/bloginstall-iptv/main/bloginstall-bangla.m3u',
    defaultCountry: 'BD',
    defaultCountryName: 'Bangladesh',
    defaultLanguage: 'ben',
    defaultLanguageName: 'Bengali'
  },
  {
    name: 'All In One IPTV',
    url: 'https://raw.githubusercontent.com/imdhiru/bloginstall-iptv/main/bloginstall-iptv.m3u',
    defaultCountry: 'IN',
    defaultCountryName: 'India',
    defaultLanguage: 'hin',
    defaultLanguageName: 'Hindi'
  },
  {
    name: 'Turkey / Regional',
    url: 'https://raw.githubusercontent.com/imdhiru/bloginstall-iptv/main/fb4k-bloginstall.m3u',
    defaultCountry: 'TR',
    defaultCountryName: 'Turkey',
    defaultLanguage: 'tur',
    defaultLanguageName: 'Turkish'
  }
];

export function parseM3u(content, sourceDefaults) {
  const lines = content.split('\n');
  const items = [];

  let currentMeta = null;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine) continue;

    if (rawLine.startsWith('#EXTINF:')) {
      const infoPart = rawLine.substring(8);
      const commaIdx = infoPart.lastIndexOf(',');
      let channelTitle = commaIdx !== -1 ? infoPart.substring(commaIdx + 1).trim() : 'Live Channel';

      channelTitle = channelTitle
        .replace(/^(Bloginstall|bloginstall\.com|fb4k|FB4K)[\s:-]*/i, '')
        .replace(/\s*-\s*(Bloginstall|bloginstall\.com|fb4k)/i, '')
        .trim();

      if (!channelTitle || /^(Bloginstall|bloginstall\.com|fb4k)$/i.test(channelTitle)) {
        currentMeta = null;
        continue;
      }

      const tvgIdMatch = infoPart.match(/tvg-id="([^"]+)"/i);
      const tvgNameMatch = infoPart.match(/tvg-name="([^"]+)"/i);
      const tvgLogoMatch = infoPart.match(/tvg-logo="([^"]+)"/i);
      const groupMatch = infoPart.match(/group-title="([^"]+)"/i);

      currentMeta = {
        name: channelTitle,
        tvgId: tvgIdMatch ? tvgIdMatch[1] : '',
        tvgName: tvgNameMatch ? tvgNameMatch[1] : channelTitle,
        logo: tvgLogoMatch ? tvgLogoMatch[1] : '',
        category: groupMatch ? groupMatch[1].trim() : 'General',
        country: sourceDefaults.defaultCountry,
        countryName: sourceDefaults.defaultCountryName,
        language: sourceDefaults.defaultLanguage,
        languageName: sourceDefaults.defaultLanguageName
      };
    } else if (!rawLine.startsWith('#')) {
      if (currentMeta && (rawLine.startsWith('http://') || rawLine.startsWith('https://'))) {
        const streamUrl = rawLine.trim();
        if (streamUrl.includes('.m3u8') || streamUrl.includes('/play.m3u8') || streamUrl.includes('/master.') || streamUrl.includes('/playlist.')) {
          items.push({
            ...currentMeta,
            url: streamUrl
          });
        }
      }
      currentMeta = null;
    }
  }

  return items;
}

export async function runM3uIngest() {
  let existingChannels = [];
  try {
    const raw = await fs.readFile(PATHS.channelsJson, 'utf-8');
    existingChannels = JSON.parse(raw);
  } catch {
    existingChannels = [];
  }

  let statusMap = {};
  try {
    const raw = await fs.readFile(PATHS.statusJson, 'utf-8');
    statusMap = JSON.parse(raw);
  } catch {
    statusMap = {};
  }

  const existingUrlSet = new Set(Object.keys(statusMap));
  for (const c of existingChannels) {
    for (const s of c.streams || []) {
      if (s.url) existingUrlSet.add(s.url);
    }
  }

  const candidates = [];
  const seenCandidateUrls = new Set();

  for (const source of M3U_SOURCES) {
    try {
      const res = await fetch(source.url, {
        headers: { 'User-Agent': VALIDATION_CONFIG.userAgent }
      });
      if (!res.ok) continue;
      const text = await res.text();
      const parsed = parseM3u(text, source);

      const maxPerSource = source.name.includes('Turkey') ? 150 : 500;
      let count = 0;

      for (const item of parsed) {
        if (existingUrlSet.has(item.url) || seenCandidateUrls.has(item.url)) {
          continue;
        }
        seenCandidateUrls.add(item.url);
        candidates.push(item);
        count++;
        if (count >= maxPerSource) break;
      }
    } catch (err) {}
  }

  const concurrency = 24;
  const verifiedActiveCandidates = [];
  let index = 0;

  async function worker() {
    while (index < candidates.length) {
      const currentIdx = index++;
      const item = candidates[currentIdx];
      const check = await validateStreamUrl(item.url);
      const checkedAt = new Date().toISOString();

      statusMap[item.url] = {
        channelName: item.name,
        country: item.country,
        category: item.category,
        language: item.language,
        url: item.url,
        status: check.status,
        http_status: check.httpStatus,
        latency_ms: check.latencyMs,
        last_checked: checkedAt
      };

      if (check.ok && check.status === 'active') {
        verifiedActiveCandidates.push({
          ...item,
          latency_ms: check.latencyMs,
          http_status: check.httpStatus,
          last_checked: checkedAt
        });
      }
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, candidates.length || 1) }, () => worker());
  await Promise.all(workers);

  const channelMap = new Map();
  for (const c of existingChannels) {
    channelMap.set(c.id, c);
  }

  for (const item of verifiedActiveCandidates) {
    const slugId = (item.tvgId || item.name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || `livora-${crypto.randomBytes(4).toString('hex')}`;

    if (!channelMap.has(slugId)) {
      channelMap.set(slugId, {
        id: slugId,
        name: item.name,
        country: item.country,
        countryName: item.countryName,
        category: item.category,
        language: item.language,
        languageName: item.languageName,
        logo: item.logo,
        epgId: item.tvgId || slugId,
        streams: []
      });
    }

    const channel = channelMap.get(slugId);
    const alreadyHasUrl = channel.streams.some(s => s.url === item.url);
    if (!alreadyHasUrl) {
      channel.streams.push({
        url: item.url,
        type: 'hls',
        status: 'active',
        quality: item.url.toLowerCase().includes('1080') ? '1080p' : item.url.toLowerCase().includes('720') ? '720p' : 'HD',
        http_status: item.http_status,
        latency_ms: item.latency_ms,
        last_checked: item.last_checked
      });
    }
  }

  const updatedChannels = Array.from(channelMap.values());
  const activeStreams = [];
  const inactiveStreams = [];
  for (const record of Object.values(statusMap)) {
    if (record.status === 'active') {
      activeStreams.push(record);
    } else {
      inactiveStreams.push(record);
    }
  }

  await fs.writeFile(PATHS.channelsJson, JSON.stringify(updatedChannels, null, 2), 'utf-8');
  await fs.writeFile(PATHS.activeStreamsJson, JSON.stringify(activeStreams, null, 2), 'utf-8');
  await fs.writeFile(PATHS.inactiveStreamsJson, JSON.stringify(inactiveStreams, null, 2), 'utf-8');
  await fs.writeFile(PATHS.statusJson, JSON.stringify(statusMap, null, 2), 'utf-8');

  await generatePlaylists();
  await generateReport();

  return {
    totalParsed: candidates.length,
    addedActive: verifiedActiveCandidates.length,
    totalChannels: updatedChannels.length
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const res = await runM3uIngest();
}
