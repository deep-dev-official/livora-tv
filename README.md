# Livora TV

<!-- Author: DEEP_DEV -->

Livora TV is an independent, automated IPTV playlist platform that provides verified, publicly accessible broadcast streams. The platform runs a scheduled health-checking pipeline every 12 hours that filters out dead links, broken manifests, and unreachable hosts to ensure reliable playback.

[![Validation Pipeline](https://github.com/deep933922-debug/livora-tv/actions/workflows/update.yml/badge.svg)](https://github.com/deep933922-debug/livora-tv/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## Public Playlist URLs

Add any of the following URLs directly into your IPTV player (VLC, TiviMate, Kodi, OTT Navigator, etc.):

| Playlist | Description | Direct M3U URL |
| :--- | :--- | :--- |
| **Master** | All verified active streams worldwide | `https://deep933922-debug.github.io/livora-tv/playlists/index.m3u` |
| **All Channels** | Complete active channels playlist | `https://deep933922-debug.github.io/livora-tv/playlists/all.m3u` |
| **India** | Verified Indian channels | `https://deep933922-debug.github.io/livora-tv/playlists/india.m3u` |
| **Bangladesh** | Verified Bangladeshi channels | `https://deep933922-debug.github.io/livora-tv/playlists/bangladesh.m3u` |
| **News** | Global and regional live news feeds | `https://deep933922-debug.github.io/livora-tv/playlists/news.m3u` |
| **Sports** | Sports channels and events | `https://deep933922-debug.github.io/livora-tv/playlists/sports.m3u` |
| **Entertainment** | General entertainment channels | `https://deep933922-debug.github.io/livora-tv/playlists/entertainment.m3u` |
| **Movies** | Movies and cinema broadcasts | `https://deep933922-debug.github.io/livora-tv/playlists/movies.m3u` |
| **Kids** | Children & family entertainment | `https://deep933922-debug.github.io/livora-tv/playlists/kids.m3u` |
| **Music** | 24/7 music video streams | `https://deep933922-debug.github.io/livora-tv/playlists/music.m3u` |
| **Bengali** | Bengali language channels | `https://deep933922-debug.github.io/livora-tv/playlists/bengali.m3u` |
| **Hindi** | Hindi language channels | `https://deep933922-debug.github.io/livora-tv/playlists/hindi.m3u` |
| **English** | English language channels | `https://deep933922-debug.github.io/livora-tv/playlists/english.m3u` |

---

## Architectural Features

1. **Automated Stream Validation**:
   - Concurrently checks candidate URLs for HTTP response codes and HLS `#EXTM3U` manifest structure.
   - Retries transient timeouts with exponential backoff before marking inactive.
   - Strips dead or forbidden links while retaining channels that have at least one working alternative stream.
2. **Multi-Bitrate & Alternate Preservation**:
   - Preserves legitimate multiple feeds (HD, SD, backup, regional) without simplistic name-based removal.
   - De-duplicates only byte-identical stream URLs.
3. **Automated GitHub Actions**:
   - Runs automated pipeline every 12 hours (`.github/workflows/update.yml`).
   - Automatically commits regenerated playlists and diagnostics when changes occur.
4. **Interactive Web Directory**:
   - Single-page portal deployed to GitHub Pages with live stats, search, category filters, 1-click clipboard copy, and browser-based HLS testing.

---

## Local Development & Pipeline Execution

```bash
# Clone repository
git clone https://github.com/deep933922-debug/livora-tv.git
cd livora-tv

# Execute the complete automated pipeline
npm run pipeline

# Run test suite
npm test
```

Pipeline commands breakdown:
- `npm run import`: Ingests feeds from public data sources.
- `npm run normalize`: Cleans URLs and produces normalized channel models.
- `npm run validate`: Tests stream reachability and manifest integrity.
- `npm run generate`: Compiles M3U playlists and JSON databases.
- `npm run report`: Generates `HEALTH_REPORT.md`.

---

## Repository Layout

```text
livora-tv/
├── channels/           # Normalized channel records (channels.json, regional JSON)
├── playlists/          # Generated M3U files (index.m3u, regional, categories)
├── streams/            # Stream health states (active.json, inactive.json, status.json)
├── scripts/            # Pipeline engines (import, normalize, validate, generate, report)
├── web/                # GitHub Pages responsive portal with live tester
├── tests/              # Automated unit tests
├── docs/               # Architecture and IPTV player configuration guides
└── .github/workflows/  # CI/CD and 12-hour automated update cron workflows
```

---

## Disclaimer & Terms of Use
Livora TV indexes publicly accessible media streams distributed by broadcast origins. Livora TV does not host, re-transmit, or modify video content. All stream pointers link directly to their respective origin servers.
