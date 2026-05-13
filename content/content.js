(() => {
  'use strict';

  // 이중 실행 방지
  if (window.__wideAiLoaded) return;
  window.__wideAiLoaded = true;

  const STYLE_ID = 'wide-ai-styles';

  // ── Site Configurations ──────────────────────────────────────
  const SITE_CONFIGS = {
    'claude.ai': {
      name: 'Claude',
      key: 'claude_width',
      getCSS(pct) {
        // 구조: max-w-3xl(외부) > max-w-3xl(메시지 리스트) + div(입력 영역)
        // 외부 컨테이너를 넓히되, 입력 영역은 원래 너비 유지
        return `
          html body [class*="overflow-y-auto"] [class*="max-w-3xl"] {
            max-width: ${pct}% !important;
          }
          html body [class*="max-w-3xl"]:has(.ProseMirror) > :not([class*="max-w-3xl"]) {
            max-width: 48rem !important;
            margin-left: auto !important;
            margin-right: auto !important;
          }
        `;
      },
      shouldApply() {
        return true;
      },
      isSplitMode() {
        return document.querySelector('[class*="artifact-renderer"], [data-testid*="artifact"]') !== null;
      }
    },

    'chatgpt.com': {
      name: 'ChatGPT',
      key: 'chatgpt_width',
      disableInSplitMode: false,
      getCSS(pct) {
        // 대화 영역은 뷰포트 기준으로 넓히고, 입력 영역(#thread-bottom-container)은 원래 크기 유지
        return `
          html body {
            --wide-ai-chatgpt-content-width: ${pct}vw !important;
          }

          html body main,
          html body [role="main"] {
            --thread-content-max-width: var(--wide-ai-chatgpt-content-width) !important;
          }

          html body [class*="thread-content-max-width"] {
            --thread-content-max-width: var(--wide-ai-chatgpt-content-width) !important;
            width: min(var(--wide-ai-chatgpt-content-width), 100%) !important;
            max-width: min(var(--wide-ai-chatgpt-content-width), 100%) !important;
            min-width: 0 !important;
          }

          html body [data-message-author-role="assistant"] .markdown,
          html body article .markdown {
            max-width: 100% !important;
            min-width: 0 !important;
          }

          html body [data-message-author-role="assistant"] .markdown :is([class*="overflow-x-auto"], [class*="-mx-"]):has(table),
          html body article .markdown :is([class*="overflow-x-auto"], [class*="-mx-"]):has(table) {
            width: 100% !important;
            max-width: 100% !important;
            min-width: 0 !important;
            margin-left: 0 !important;
            margin-right: 0 !important;
            overflow-x: auto !important;
          }

          html body [data-message-author-role="assistant"] .markdown table,
          html body article .markdown table {
            margin-left: 0 !important;
            margin-right: 0 !important;
          }

          html body [data-message-author-role="assistant"] .markdown :is([class*="overflow-x-auto"], [class*="-mx-"]):has(table) table,
          html body article .markdown :is([class*="overflow-x-auto"], [class*="-mx-"]):has(table) table {
            width: max-content !important;
            min-width: 100% !important;
          }

          html body #thread-bottom-container,
          html body #thread-bottom-container [class*="thread-content-max-width"] {
            --thread-content-max-width: 48rem !important;
          }

          html body #thread-bottom-container [class*="thread-content-max-width"] {
            width: min(48rem, 100%) !important;
            max-width: 48rem !important;
          }
        `;
      },
      shouldApply() {
        // 프로젝트 페이지, GPT 설정 페이지 등에서는 적용하지 않음
        const path = window.location.pathname;
        return !path.endsWith('/project') && !path.includes('/editor');
      },
      isSplitMode() {
        return document.querySelector('[class*="canvas-panel"], [data-testid*="canvas"]') !== null;
      }
    }
  };

  // ── Site Detection ───────────────────────────────────────────
  const hostname = window.location.hostname;
  const config = SITE_CONFIGS[hostname];
  if (!config) return;

  let currentWidth = null;
  let splitMode = false;
  let debounceTimer = null;
  let lastUrl = window.location.href;

  // ── Style Injection ──────────────────────────────────────────
  function injectStyles(pct) {
    let styleEl = document.getElementById(STYLE_ID);
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = STYLE_ID;
    }
    const styleHost = document.head || document.documentElement;
    if (styleHost && styleEl.parentNode !== styleHost) styleHost.appendChild(styleEl);
    styleEl.textContent = config.getCSS(pct);
  }

  function removeStyles() {
    document.getElementById(STYLE_ID)?.remove();
  }

  function applyWidth() {
    const shouldDisableForSplitMode = splitMode && config.disableInSplitMode !== false;
    if (!currentWidth || shouldDisableForSplitMode || !config.shouldApply()) {
      removeStyles();
    } else {
      injectStyles(currentWidth);
    }
  }

  // ── Split Mode Detection ─────────────────────────────────────
  function checkSplitMode() {
    const wasSplit = splitMode;
    splitMode = config.isSplitMode();
    if (wasSplit !== splitMode) applyWidth();
  }

  // ── URL Change Detection (SPA) ───────────────────────────────
  function checkUrlChange() {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      applyWidth();
    }
  }

  // ── Initialize ───────────────────────────────────────────────
  chrome.storage.sync.get([config.key], (result) => {
    currentWidth = result[config.key] || null;
    splitMode = config.isSplitMode();
    applyWidth();
  });

  // ── Storage Change Listener ──────────────────────────────────
  chrome.storage.onChanged.addListener((changes, ns) => {
    if (ns === 'sync' && changes[config.key]) {
      currentWidth = changes[config.key].newValue || null;
      applyWidth();
    }
  });

  // ── MutationObserver ─────────────────────────────────────────
  const observer = new MutationObserver(() => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      checkUrlChange();
      checkSplitMode();
    }, 500);
  });
  observer.observe(document.documentElement || document, { childList: true, subtree: true });

  document.addEventListener('DOMContentLoaded', () => {
    applyWidth();
  }, { once: true });

  // ── Message Handler ──────────────────────────────────────────
  chrome.runtime.onMessage.addListener((msg, _, sendResponse) => {
    if (msg.type === 'GET_SITE_INFO') {
      sendResponse({ hostname, name: config.name, key: config.key });
    }
  });
})();
