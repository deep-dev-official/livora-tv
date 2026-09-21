/**
 * @author DEEP_DEV
 */

import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { PATHS, VALIDATION_CONFIG } from './config.js';

export async function checkSingleAttempt(url, headers = {}) {
  const startTime = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), VALIDATION_CONFIG.timeoutMs);

  try {
    const reqHeaders = {
      'User-Agent': headers.userAgent || VALIDATION_CONFIG.userAgent,
      'Accept': '*/*',
      'Range': 'bytes=0-2048',
      ...(headers.httpReferrer ? { 'Referer': headers.httpReferrer } : {})
    };

    const response = await fetch(url, {
      method: 'GET',
      headers: reqHeaders,
      signal: controller.signal,
      redirect: 'follow'
    });

    clearTimeout(timer);
    const latencyMs = Date.now() - startTime;
    const status = response.status;

    if (status === 404) {
      return { ok: false, status: 'not_found', httpStatus: status, latencyMs };
    }
    if (status === 403 || status === 401) {
      return { ok: false, status: 'forbidden', httpStatus: status, latencyMs };
    }
    if (status >= 500) {
      return { ok: false, status: 'server_error', httpStatus: status, latencyMs };
    }
    if (status !== 200 && status !== 206) {
      return { ok: false, status: 'inactive', httpStatus: status, latencyMs };
    }

    const textChunk = await response.text();
    const isHls = url.toLowerCase().includes('.m3u8') || (response.headers.get('content-type') || '').includes('mpegurl');

    if (isHls) {
      if (!textChunk.includes('#EXTM3U')) {
        return { ok: false, status: 'invalid_manifest', httpStatus: status, latencyMs };
      }
    }

    return { ok: true, status: 'active', httpStatus: status, latencyMs };
  } catch (error) {
    clearTimeout(timer);
    const latencyMs = Date.now() - startTime;
    if (error.name === 'AbortError') {
      return { ok: false, status: 'timeout', httpStatus: 0, latencyMs };
    }
    return { ok: false, status: 'inactive', httpStatus: 0, latencyMs, error: error.message };
  }
}

export async function validateStreamUrl(url, headers = {}) {
  let attempt = 0;
  let lastResult = null;

  while (attempt <= VALIDATION_CONFIG.maxRetries) {
    lastResult = await checkSingleAttempt(url, headers);
    if (lastResult.ok) {
      return lastResult;
    }
    if (lastResult.status === 'not_found' || lastResult.status === 'forbidden') {
      return lastResult;
    }
    attempt += 1;
    if (attempt <= VALIDATION_CONFIG.maxRetries) {
      await new Promise(resolve => setTimeout(resolve, VALIDATION_CONFIG.retryDelayMs));
    }
  }

  return lastResult;
}

export async function runValidation(options = {}) {
  await fs.mkdir(PATHS.streamsDir, { recursive: true });

  let channels = [];
  try {
    const raw = await fs.readFile(PATHS.channelsJson, 'utf-8');
    channels = JSON.parse(raw);
  } catch {
    channels = [];
  }

  let statusMap = {};
  try {
    const rawStatus = await fs.readFile(PATHS.statusJson, 'utf-8');
    statusMap = JSON.parse(rawStatus);
  } catch {
    statusMap = {};
  }

  const concurrency = options.concurrency || VALIDATION_CONFIG.concurrency;
  const streamJobs = [];
  const limit = options.limit || (process.argv.find(a => a.startsWith('--limit=')) ? parseInt(process.argv.find(a => a.startsWith('--limit=')).split('=')[1], 10) : null);
  const targetCountry = options.country || (process.argv.find(a => a.startsWith('--country=')) ? process.argv.find(a => a.startsWith('--country=')).split('=')[1].toUpperCase() : null);

  for (const channel of channels) {
    if (targetCountry && channel.country !== targetCountry) continue;
    for (const stream of channel.streams) {
      streamJobs.push({ channel, stream });
      if (limit && streamJobs.length >= limit) break;
    }
    if (limit && streamJobs.length >= limit) break;
  }

  let index = 0;
  async function worker() {
    while (index < streamJobs.length) {
      const currentIdx = index++;
      const { channel, stream } = streamJobs[currentIdx];

      const validation = await validateStreamUrl(stream.url, {
        userAgent: stream.userAgent,
        httpReferrer: stream.httpReferrer
      });

      const checkedAt = new Date().toISOString();
      stream.status = validation.status;
      stream.http_status = validation.httpStatus;
      stream.latency_ms = validation.latencyMs;
      stream.last_checked = checkedAt;

      const record = {
        channelId: channel.id,
        channelName: channel.name,
        country: channel.country,
        category: channel.category,
        language: channel.language,
        url: stream.url,
        quality: stream.quality,
        status: validation.status,
        http_status: validation.httpStatus,
        latency_ms: validation.latencyMs,
        last_checked: checkedAt
      };

      statusMap[stream.url] = record;
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, streamJobs.length || 1) }, () => worker());
  await Promise.all(workers);

  const mergedActive = [];
  const mergedInactive = [];
  for (const record of Object.values(statusMap)) {
    if (record.status === 'active') {
      mergedActive.push(record);
    } else {
      mergedInactive.push(record);
    }
  }

  await fs.writeFile(PATHS.channelsJson, JSON.stringify(channels, null, 2), 'utf-8');
  await fs.writeFile(PATHS.activeStreamsJson, JSON.stringify(mergedActive, null, 2), 'utf-8');
  await fs.writeFile(PATHS.inactiveStreamsJson, JSON.stringify(mergedInactive, null, 2), 'utf-8');
  await fs.writeFile(PATHS.statusJson, JSON.stringify(statusMap, null, 2), 'utf-8');

  return {
    totalChecked: streamJobs.length,
    activeCount: mergedActive.length,
    inactiveCount: mergedInactive.length
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await runValidation();
}
