/**
 * @author DEEP_DEV
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PATHS } from './config.js';

export async function generateReport() {
  let stats = {};
  let statusMap = {};
  let activeList = [];
  let inactiveList = [];

  try {
    stats = JSON.parse(await fs.readFile(path.join(PATHS.root, 'stats.json'), 'utf-8'));
  } catch {}
  try {
    statusMap = JSON.parse(await fs.readFile(PATHS.statusJson, 'utf-8'));
  } catch {}
  try {
    activeList = JSON.parse(await fs.readFile(PATHS.activeStreamsJson, 'utf-8'));
  } catch {}
  try {
    inactiveList = JSON.parse(await fs.readFile(PATHS.inactiveStreamsJson, 'utf-8'));
  } catch {}

  const reasons = {
    timeout: 0,
    forbidden: 0,
    not_found: 0,
    server_error: 0,
    invalid_manifest: 0,
    other: 0
  };

  for (const item of inactiveList) {
    if (reasons[item.status] !== undefined) {
      reasons[item.status]++;
    } else {
      reasons.other++;
    }
  }

  const report = `# Livora TV — Stream Health & Validation Report

Generated on: ${new Date().toUTCString()}

## System Overview
- **Active Channels:** ${stats.total_channels || 0}
- **Active Working Streams:** ${stats.total_active_streams || 0}
- **Total Monitored Streams:** ${activeList.length + inactiveList.length}
- **Total Countries:** ${stats.total_countries || 0}
- **Total Languages:** ${stats.total_languages || 0}
- **Total Categories:** ${stats.total_categories || 0}

## Stream Health Breakdown
| Metric | Count | Percentage |
| :--- | :--- | :--- |
| **Active / Playable** | ${activeList.length} | ${activeList.length + inactiveList.length > 0 ? ((activeList.length / (activeList.length + inactiveList.length)) * 100).toFixed(1) : 0}% |
| **Inactive / Dead** | ${inactiveList.length} | ${activeList.length + inactiveList.length > 0 ? ((inactiveList.length / (activeList.length + inactiveList.length)) * 100).toFixed(1) : 0}% |

### Inactivity Diagnostics
- **Timeouts:** ${reasons.timeout}
- **Forbidden / Auth Required (403/401):** ${reasons.forbidden}
- **Not Found (404):** ${reasons.not_found}
- **Server Errors (5xx):** ${reasons.server_error}
- **Invalid HLS Manifest:** ${reasons.invalid_manifest}
- **Other Connection Errors:** ${reasons.other}

## Quality Assurance Policy
Livora TV excludes any stream that returns a non-200 HTTP response or fails HLS manifest structural checks. Dead streams are marked inactive rather than deleting the channel from the database, allowing automatic recovery if the broadcaster stream returns online.
`;

  await fs.writeFile(path.join(PATHS.root, 'HEALTH_REPORT.md'), report, 'utf-8');
  return report;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await generateReport();
}
