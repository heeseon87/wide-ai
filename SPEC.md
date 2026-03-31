# Wide AI — Chrome Extension Spec

## 개요

AI 채팅 사이트(claude.ai, chatgpt.com)의 **대화 영역 너비**를 사용자가 원하는 비율로 조절하는 크롬 익스텐션.
입력창은 변경하지 않으며, 대화 메시지 히스토리의 가로 너비만 조절한다.

## 핵심 요구사항

### 기능
- 사이트별 독립적인 너비 조절 (claude.ai / chatgpt.com 각각 다른 설정)
- 슬라이더 + 숫자 직접 입력으로 너비 조절 (50% ~ 100%)
- 설정값은 `chrome.storage.sync`에 저장하여 브라우저 간 동기화
- 리셋 버튼으로 사이트 기본값 복원
- 익스텐션 비활성화/삭제 시 즉시 원래 레이아웃으로 복원

### 조절 대상
- **O** 대화 영역 (메시지 히스토리)의 max-width
- **X** 입력창 (조절하지 않음)
- **X** 사이드바, 헤더 등 기타 UI 요소

### 동작 조건
| 상황 | 동작 |
|------|------|
| 일반 채팅 | 너비 조절 활성화 |
| 스트리밍 중 | 새 메시지 DOM에도 자동 적용 |
| 새 채팅 전환 (SPA) | MutationObserver로 자동 재적용 |
| Artifacts/Canvas 분할 모드 | 너비 조절 **비활성화** |
| 익스텐션 비활성화 | 즉시 원래 너비로 복원 |

## 기술 설계

### 아키텍처

```
popup.html/js          ← 사용자 UI (슬라이더 + 숫자 입력)
    ↓ chrome.storage
background.js          ← 설정 관리, 탭 상태 감지
    ↓ chrome.tabs.sendMessage
content-script.js      ← CSS 주입/제거, MutationObserver
    ↓ <style> 태그 주입
사이트 DOM              ← max-width 오버라이드
```

### DOM 감지 전략: MutationObserver
- SPA 라우팅에 의한 채팅 전환을 감지하여 스타일 재적용
- 스트리밍 중 새로 추가되는 메시지 DOM에도 자동 적용
- **성능 최적화**: subtree 감시 범위를 대화 컨테이너로 한정

### CSS 선택자 전략: 안정적 선택자 우선
- `data-testid`, `role`, 시맨틱 태그 등 변경 가능성이 낮은 속성 기반
- 해시된 클래스명(`css-1a2b3c`) 사용 회피
- 사이트 업데이트 시 깨질 확률 최소화

### 스타일 적용 방식
- `<style id="wide-ai-styles">` 태그를 `<head>`에 주입
- `!important`로 사이트 기본 스타일 오버라이드
- 비활성화 시 해당 `<style>` 태그 제거로 즉시 원복

### 슬라이더 반응성
- 실시간 반영 + debounce (150ms)
- 드래그 중 즉시 시각적 피드백, storage 저장은 debounce 적용

### Artifacts/Canvas 분할 모드 감지
- Claude: Artifacts 패널의 존재 여부를 DOM으로 감지
- ChatGPT: Canvas 모드 활성화 여부를 DOM으로 감지
- 분할 모드 진입 시 주입된 스타일 비활성화, 해제 시 재활성화

## UI 설계

### 팝업 (popup.html)

```
┌─────────────────────────────┐
│  🔲  Wide AI                │
├─────────────────────────────┤
│                             │
│  Claude.ai                  │
│  [════════●══] [75]%        │
│                             │
│  ChatGPT                    │
│  [══════════●] [90]%        │
│                             │
│  ─────────────────────────  │
│            [리셋]           │
└─────────────────────────────┘
```

- 현재 탭이 지원 사이트가 아닌 경우: "지원하지 않는 사이트입니다" 표시
- 슬라이더 옆 숫자를 클릭하면 직접 입력 가능
- 리셋 버튼: 모든 사이트를 기본값으로 복원

### 디자인 톤
- 시스템 테마(라이트/다크)에 맞춰 자동 전환
- `prefers-color-scheme` 미디어 쿼리 사용
- 미니멀하고 깔끔한 UI

## 사이트별 설정

### claude.ai
- **조절 대상**: 대화 메시지의 max-width
- **기본 CSS 타겟** (안정적 선택자 조사 필요):
  - 메시지 컨테이너의 max-width 속성
- **분할 모드 감지**: Artifacts 패널 DOM 존재 여부

### chatgpt.com
- **조절 대상**: 대화 메시지의 max-width
- **기본 CSS 타겟** (안정적 선택자 조사 필요):
  - 메시지 컨테이너의 max-width 속성
- **분할 모드 감지**: Canvas 모드 DOM 존재 여부

## 모듈 구조 (확장 고려)

```javascript
// 사이트 설정 모듈 구조 (향후 Gemini, Perplexity 등 추가 용이)
const siteConfigs = {
  'claude.ai': {
    name: 'Claude.ai',
    selectors: { ... },
    splitModeDetector: () => { ... },
    defaultWidth: null,  // 사이트 기본값 사용
  },
  'chatgpt.com': {
    name: 'ChatGPT',
    selectors: { ... },
    splitModeDetector: () => { ... },
    defaultWidth: null,
  },
};
```

## 파일 구조

```
wide-ai/
├── manifest.json          # Manifest V3
├── popup/
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
├── content/
│   ├── content.js         # 공통 로직 (Observer, 스타일 주입)
│   └── sites/
│       ├── claude.js       # claude.ai 전용 선택자/감지
│       └── chatgpt.js      # chatgpt.com 전용 선택자/감지
├── background.js           # Service Worker
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── SPEC.md
```

## Manifest V3 권한

```json
{
  "manifest_version": 3,
  "permissions": ["storage", "activeTab"],
  "host_permissions": [
    "https://claude.ai/*",
    "https://chatgpt.com/*"
  ],
  "content_scripts": [{
    "matches": ["https://claude.ai/*", "https://chatgpt.com/*"],
    "js": ["content/content.js"]
  }]
}
```

## 너비 조절 범위

| 설정 | 값 |
|------|-----|
| 최솟값 | 50% |
| 최댓값 | 100% |
| 기본값 | 사이트 원래 값 (조절 없음) |
| 단위 | 뷰포트 대비 퍼센트 (%) |
| 조절 단위 | 1% 단위 |

## 배포

- **1차**: 개인 사용 (chrome://extensions → 개발자 모드 → 로드)
- **2차**: 완성 후 Chrome Web Store 배포 고려

## 비기능 요구사항

- 성능: MutationObserver의 감시 범위를 최소화하여 CPU 사용량 억제
- 안정성: 사이트 업데이트에 강건한 선택자 전략
- 복원성: 익스텐션 제거 시 사이트에 흔적을 남기지 않음
- 호환성: Chrome 114+ (Manifest V3 + Side Panel API 기준)
