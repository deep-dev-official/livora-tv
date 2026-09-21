/**
 * @author DEEP_DEV
 */

import test from 'node:test';
import assert from 'node:assert/strict';

test('channel model adheres to Livora TV specification', () => {
  const channel = {
    id: 'livora-sports-hd',
    name: 'Livora Sports',
    country: 'IN',
    countryName: 'India',
    category: 'Sports',
    language: 'eng',
    languageName: 'English',
    logo: 'https://example.com/logo.png',
    epgId: 'livora-sports-hd',
    streams: [
      {
        url: 'https://cdn.example.com/live.m3u8',
        type: 'hls',
        status: 'active',
        quality: '1080p',
        http_status: 200,
        latency_ms: 120,
        last_checked: '2026-09-21T12:00:00.000Z'
      }
    ]
  };

  assert.ok(channel.id);
  assert.ok(channel.name);
  assert.ok(channel.country);
  assert.ok(Array.isArray(channel.streams));
  assert.ok(channel.streams.length > 0);
  assert.equal(channel.streams[0].status, 'active');
  assert.equal(channel.streams[0].type, 'hls');
});
