# Livora TV — Stream Health & Validation Report

Generated on: Mon, 21 Sep 2026 11:12:50 GMT

## System Overview
- **Active Channels:** 193
- **Active Working Streams:** 302
- **Total Monitored Streams:** 383
- **Total Countries:** 9
- **Total Languages:** 24
- **Total Categories:** 21

## Stream Health Breakdown
| Metric | Count | Percentage |
| :--- | :--- | :--- |
| **Active / Playable** | 326 | 85.1% |
| **Inactive / Dead** | 57 | 14.9% |

### Inactivity Diagnostics
- **Timeouts:** 19
- **Forbidden / Auth Required (403/401):** 15
- **Not Found (404):** 3
- **Server Errors (5xx):** 5
- **Invalid HLS Manifest:** 1
- **Other Connection Errors:** 14

## Quality Assurance Policy
Livora TV excludes any stream that returns a non-200 HTTP response or fails HLS manifest structural checks. Dead streams are marked inactive rather than deleting the channel from the database, allowing automatic recovery if the broadcaster stream returns online.
