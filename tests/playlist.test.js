/**
 * @author DEEP_DEV
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { buildM3uEntry, createM3uHeader, sanitizeSlug } from '../scripts/generate.js';

test('createM3uHeader produces valid EXTM3U with EPG pointer', () => {
  const header = createM3uHeader();
  assert.ok(header.startsWith('#EXTM3U'));
  assert.ok(header.includes('x-tvg-url='));
});

test('buildM3uEntry generates valid IPTV syntax', () => {
  const channel = {
    id: 'test-news',
    name: 'Test News',
    country: 'BD',
    countryName: 'Bangladesh',
    category: 'News',
    logo: 'https://cdn.example.com/logo.png',
    epgId: 'test-news.bd'
  };
  const stream = {
    url: 'https://stream.example.com/live.m3u8',
    quality: '720p'
  };

  const entry = buildM3uEntry(channel, stream);
  assert.ok(entry.includes('#EXTINF:-1'));
  assert.ok(entry.includes('tvg-id="test-news.bd"'));
  assert.ok(entry.includes('group-title="News"'));
  assert.ok(entry.includes('Test News (720p)'));
  assert.ok(entry.includes('https://stream.example.com/live.m3u8'));
});

test('sanitizeSlug cleans special characters', () => {
  assert.equal(sanitizeSlug('United States'), 'united-states');
  assert.equal(sanitizeSlug('News & Current Affairs'), 'news-current-affairs');
  assert.equal(sanitizeSlug(''), 'unknown');
});
