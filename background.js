// Wide AI - Service Worker

const MATCH_URLS = ['https://claude.ai/*', 'https://chatgpt.com/*'];

// 설치/업데이트 시 이미 열린 탭에 content script 주입
chrome.runtime.onInstalled.addListener(() => {
  chrome.tabs.query({ url: MATCH_URLS }, (tabs) => {
    for (const tab of tabs) {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content/content.js']
      }).catch(() => {});
    }
  });
});
