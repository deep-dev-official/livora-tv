/**
 * @author DEEP_DEV
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeUrl, normalizeChannels, detectStreamType } from '../scripts/normalize.js';

test('normalizeUrl strips marketing tracking queries', () => {
  const url = 'https://example.com/live/stream.m3u8?token=xyz&utm_source=fb&utm_medium=cpc';
  const clean = normalizeUrl(url);
  assert.equal(clean, 'https://example.com/live/stream.m3u8?token=xyz');
});

test('detectStreamType identifies HLS and DASH correctly', () => {
  assert.equal(detectStreamType('https://test.com/stream.m3u8'), 'hls');
  assert.equal(detectStreamType('https://test.com/stream.mpd'), 'dash');
  assert.equal(detectStreamType('https://test.com/stream.ts'), 'mpegts');
});

test('normalizeChannels deduplicates identical URLs but preserves quality variants', () => {
  const sampleItems = [
    {
      channelId: 'channel-one',
      name: 'Channel One',
      country: 'IN',
      streamUrl: 'https://cdn.example.com/ch1_hd.m3u8',
      quality: 'HD'
    },
    {
      channelId: 'channel-one',
      name: 'Channel One',
      country: 'IN',
      streamUrl: 'https://cdn.example.com/ch1_hd.m3u8',
      quality: 'HD'
    },
    {
      channelId: 'channel-one',
      name: 'Channel One',
      country: 'IN',
      streamUrl: 'https://cdn.example.com/ch1_sd.m3u8',
      quality: 'SD'
    }
  ];

  const channels = normalizeChannels(sampleItems);
  assert.equal(channels.length, 1);
  assert.equal(channels[0].streams.length, 2);
  assert.equal(channels[0].streams[0].quality, 'HD');
  assert.equal(channels[0].streams[1].quality, 'SD');
});
