/**
 * @author DEEP_DEV
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { SOURCES, PATHS, TARGET_COUNTRIES } from './config.js';

async function fetchJson(url, fallbackValue = []) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'LivoraTV-Importer/1.0'
      }
    });
    clearTimeout(timeout);
    if (!response.ok) {
      return fallbackValue;
    }
    return await response.json();
  } catch {
    return fallbackValue;
  }
}

export async function runImport() {
  await fs.mkdir(PATHS.channelsDir, { recursive: true });
  await fs.mkdir(PATHS.streamsDir, { recursive: true });

  const [rawChannels, rawStreams, rawFeeds, rawLogos, rawCategories, rawLanguages, rawCountries] = await Promise.all([
    fetchJson(SOURCES.iptvOrg.channels),
    fetchJson(SOURCES.iptvOrg.streams),
    fetchJson(SOURCES.iptvOrg.feeds),
    fetchJson(SOURCES.iptvOrg.logos),
    fetchJson(SOURCES.iptvOrg.categories),
    fetchJson(SOURCES.iptvOrg.languages),
    fetchJson(SOURCES.iptvOrg.countries)
  ]);

  const channelMap = new Map();
  for (const channel of rawChannels) {
    if (channel && channel.id) {
      channelMap.set(channel.id, channel);
    }
  }

  const channelLangMap = new Map();
  for (const feed of rawFeeds) {
    if (feed && feed.channel && feed.languages && feed.languages.length > 0 && !channelLangMap.has(feed.channel)) {
      channelLangMap.set(feed.channel, feed.languages[0].toLowerCase());
    }
  }

  const logoMap = new Map();
  for (const logo of rawLogos) {
    if (logo && logo.channel && !logoMap.has(logo.channel)) {
      logoMap.set(logo.channel, logo.url);
    }
  }

  const countryMap = new Map();
  for (const c of rawCountries) {
    if (c && c.code) {
      countryMap.set(c.code.toUpperCase(), c.name);
    }
  }

  const categoryMap = new Map();
  for (const cat of rawCategories) {
    if (cat && cat.id) {
      categoryMap.set(cat.id.toLowerCase(), cat.name);
    }
  }

  const languageMap = new Map();
  for (const lang of rawLanguages) {
    if (lang && lang.code) {
      languageMap.set(lang.code.toLowerCase(), lang.name);
    }
  }

  const targetSet = new Set(TARGET_COUNTRIES);
  const importedList = [];

  const defaultCountryLang = {
    'BD': 'ben',
    'IN': 'hin',
    'PK': 'urd',
    'US': 'eng',
    'GB': 'eng',
    'CA': 'eng',
    'AU': 'eng',
    'DE': 'deu',
    'FR': 'fra',
    'SA': 'ara',
    'AE': 'ara'
  };

  for (const item of rawStreams) {
    if (!item.url || typeof item.url !== 'string') continue;
    const streamUrl = item.url.trim();
    if (!streamUrl.startsWith('http://') && !streamUrl.startsWith('https://')) continue;

    const channel = item.channel ? channelMap.get(item.channel) : null;
    const countryCode = (channel?.country || item.country || (item.channel ? item.channel.split('.').pop() : 'INT')).toUpperCase();

    if (targetSet.size > 0 && !targetSet.has(countryCode)) {
      continue;
    }

    const channelId = channel?.id || (item.channel ? item.channel : `ch-${crypto.createHash('md5').update(streamUrl).digest('hex').slice(0, 8)}`);
    const channelName = channel?.name || item.title || item.channel || 'Live Stream';
    const countryName = countryMap.get(countryCode) || countryCode;
    const primaryCat = channel?.categories?.[0] ? channel.categories[0].toLowerCase() : 'general';
    const categoryName = categoryMap.get(primaryCat) || 'General';

    const rawLangCode = channelLangMap.get(item.channel) || channelLangMap.get(channel?.id) || defaultCountryLang[countryCode] || 'eng';
    const languageCode = rawLangCode.toLowerCase();
    const languageName = languageMap.get(languageCode) || (languageCode === 'ben' ? 'Bengali' : languageCode === 'hin' ? 'Hindi' : 'English');
    const logoUrl = logoMap.get(item.channel) || channel?.logo || '';

    const streamQuality = item.quality || (item.height ? `${item.height}p` : 'HD');

    importedList.push({
      channelId,
      name: channelName,
      country: countryCode,
      countryName,
      category: categoryName,
      language: languageCode,
      languageName,
      logo: logoUrl,
      epgId: channel?.id || channelId,
      streamUrl,
      quality: streamQuality,
      httpReferrer: item.referrer || '',
      userAgent: item.user_agent || ''
    });
  }

  const outputPath = path.join(PATHS.channelsDir, 'imported_raw.json');
  await fs.writeFile(outputPath, JSON.stringify(importedList, null, 2), 'utf-8');
  return importedList;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await runImport();
}
