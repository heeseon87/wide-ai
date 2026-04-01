# Privacy Policy — Wide AI

**Last updated:** April 1, 2026

## Overview

Wide AI is a Chrome extension that adjusts the conversation area width on AI chat sites (claude.ai and chatgpt.com). This extension is designed with privacy as a core principle.

## Data Collection

Wide AI does **not** collect, store, or transmit any personal data. Specifically:

- No personal information is collected
- No browsing history is tracked
- No website content is read or stored
- No data is sent to external servers
- No analytics or tracking tools are used
- No cookies are created

## Data Storage

The only data stored is your **width preference settings** (a number between 50-100 for each supported site). This is saved locally in your browser using `chrome.storage.sync` and is never transmitted to any third party.

## Permissions

The extension requests the following permissions, used solely for its core functionality:

| Permission | Purpose |
|------------|---------|
| `storage` | Save your width preferences locally |
| `activeTab` | Detect which supported site you are currently viewing |
| `scripting` | Inject the content script into already-open tabs on install |
| Host access (`claude.ai`, `chatgpt.com`) | Apply CSS width adjustments to the conversation area |

## Third Parties

Wide AI does not share any data with third parties. There are no advertisements, analytics, or external services integrated into this extension.

## Changes

If this privacy policy is updated, the changes will be reflected in this document with an updated date.

## Contact

If you have questions about this privacy policy, please open an issue on the [GitHub repository](https://github.com/heeseon87/wide-ai).
