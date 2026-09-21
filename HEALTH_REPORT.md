# Livora TV — Stream Health & Validation Report

Generated on: Mon, 21 Sep 2026 11:18:53 GMT

## System Overview
- **Active Channels:** 226
- **Active Working Streams:** 342
- **Total Monitored Streams:** 675
- **Total Countries:** 10
- **Total Languages:** 24
- **Total Categories:** 24

## Stream Health Breakdown
| Metric | Count | Percentage |
| :--- | :--- | :--- |
| **Active / Playable** | 366 | 54.2% |
| **Inactive / Dead** | 309 | 45.8% |

### Inactivity Diagnostics
- **Timeouts:** 48
- **Forbidden / Auth Required (403/401):** 18
- **Not Found (404):** 84
- **Server Errors (5xx):** 10
- **Invalid HLS Manifest:** 2
- **Other Connection Errors:** 147

## Quality Assurance Policy
Livora TV excludes any stream that returns a non-200 HTTP response or fails HLS manifest structural checks. Dead streams are marked inactive rather than deleting the channel from the database, allowing automatic recovery if the broadcaster stream returns online.
