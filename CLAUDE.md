# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

Wide AI는 AI 채팅 사이트(claude.ai, chatgpt.com)의 대화 영역 너비를 조절하는 Chrome 확장 프로그램(Manifest V3). 입력창은 변경하지 않고 메시지 히스토리의 max-width만 조절한다.

## 빌드 및 테스트

빌드 도구나 번들러 없음. 순수 JavaScript로 작성되어 있으며, `chrome://extensions` 개발자 모드에서 직접 로드하여 테스트한다. 배포용 zip은 수동 생성(`wide-ai-v0.1.0.zip`).

## 아키텍처

```
popup/popup.{html,css,js}  ← 사용자 UI (슬라이더 50-100%)
        ↓ chrome.storage.sync
content/content.js         ← CSS 주입/제거, MutationObserver, 분할모드 감지
        ↓ <style id="wide-ai-styles"> 주입
사이트 DOM                  ← max-width 오버라이드

background.js              ← 설치/업데이트 시 기존 탭에 content script 재주입
```

핵심 흐름: popup이 `chrome.storage.sync`에 너비 값을 저장하면, content script가 `storage.onChanged`로 감지하여 즉시 `<style>` 태그를 갱신한다.

## 주요 설계 원칙

- **사이트별 설정 객체(`SITE_CONFIGS`)**: `content.js`에 사이트별 CSS 생성 함수(`getCSS`), 분할모드 감지(`isSplitMode`), 적용 조건(`shouldApply`)이 모듈화되어 있음. 새 사이트 추가 시 이 객체에 항목 추가.
- **CSS 선택자**: 해시된 클래스명 사용 금지. `data-testid`, `role`, `[class*="..."]` 패턴 등 안정적 선택자 사용.
- **분할모드(Artifacts/Canvas)**: 분할모드 진입 시 스타일 비활성화, 해제 시 재활성화.
- **입력창 보존**: 대화 영역을 넓히되 입력 영역은 원래 너비(48rem)로 고정.
- **MutationObserver**: SPA 라우팅/스트리밍 대응. 500ms debounce.
