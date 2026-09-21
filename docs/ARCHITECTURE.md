# Livora TV Architecture Specification

## Overview
Livora TV is an automated IPTV stream ingestion, health-checking, and playlist delivery pipeline engineered for high-availability media playback.

## Pipeline Lifecycle

```
[Public Feeds / Community APIs]
               │
               ▼
   [scripts/import.js]  ──── Ingests raw JSON & M3U streams
               │
               ▼
 [scripts/normalize.js] ──── Deduplicates identical URLs, retains valid bitrate/quality variants
               │
               ▼
  [scripts/validate.js] ──── Concurrently validates HLS headers & manifests with retry backoff
               │
         ┌─────┴─────┐
         ▼           ▼
      ACTIVE      INACTIVE
   (Playable)    (Diagnostic Log)
         │
         ▼
  [scripts/generate.js] ──── Builds M3U playlists (Master, Country, Language, Category)
         │
         ▼
  [scripts/report.js]   ──── Produces markdown validation summary
```

## Stream Validation Engine
The validator connects to candidate streams with standard HTTP headers, checking:
1. HTTP status code (200 / 206)
2. Response latency
3. First 2KB payload inspection for valid `#EXTM3U` and media chunk tags
4. Exponential backoff retry for transient network drops

## Storage & Output
- `channels/`: Master normalized channel records with embedded streams.
- `streams/active.json`: Fast lookup list of verified working streams.
- `streams/inactive.json`: Dead streams with HTTP status and reason code.
- `playlists/`: Clean `.m3u` files structured by regional and categorical taxonomies.
- `web/`: Client-side single-page application for previewing streams and copying playlist URLs.
