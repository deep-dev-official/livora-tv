# Livora TV — Stream Health & Validation Report

Generated on: Mon, 21 Sep 2026 11:52:00 GMT

## System Overview
- **Active Channels:** 11875
- **Active Working Streams:** 17478
- **Total Monitored Streams:** 1175
- **Total Countries:** 179
- **Total Languages:** 122
- **Total Categories:** 28

## Stream Health Breakdown
| Metric | Count | Percentage |
| :--- | :--- | :--- |
| **Active / Playable** | 653 | 55.6% |
| **Inactive / Dead** | 522 | 44.4% |

### Inactivity Diagnostics
- **Timeouts:** 189
- **Forbidden / Auth Required (403/401):** 34
- **Not Found (404):** 85
- **Server Errors (5xx):** 16
- **Invalid HLS Manifest:** 2
- **Other Connection Errors:** 196

## Quality Assurance Policy
Livora TV excludes any stream that returns a non-200 HTTP response or fails HLS manifest structural checks. Dead streams are marked inactive rather than deleting the channel from the database, allowing automatic recovery if the broadcaster stream returns online.
