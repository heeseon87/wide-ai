const SITES = [
  { key: 'claude_width',  hostname: 'claude.ai',  badgeId: 'claude-badge'  },
  { key: 'chatgpt_width', hostname: 'chatgpt.com', badgeId: 'chatgpt-badge' }
];

// ── Detect current tab & show badge ────────────────────────────
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const url = tabs[0]?.url || '';
  let matched = false;

  for (const site of SITES) {
    if (url.includes(site.hostname)) {
      document.getElementById(site.badgeId).classList.add('visible');
      matched = true;
    }
  }

  if (!matched) {
    document.getElementById('unsupported-msg').classList.add('visible');
  }
});

// ── Load saved settings ────────────────────────────────────────
chrome.storage.sync.get(SITES.map(s => s.key), (result) => {
  for (const site of SITES) {
    const slider = document.getElementById(`${site.key}_slider`);
    const numberInput = document.getElementById(`${site.key}_number`);
    const value = result[site.key];

    if (value) {
      slider.value = value;
      numberInput.value = value;
    }
  }
});

// ── Slider & number input handlers ─────────────────────────────
for (const site of SITES) {
  const slider = document.getElementById(`${site.key}_slider`);
  const numberInput = document.getElementById(`${site.key}_number`);

  let saveTimer;

  // Slider drag → real-time update + debounced save
  slider.addEventListener('input', () => {
    const value = parseInt(slider.value);
    numberInput.value = value;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      chrome.storage.sync.set({ [site.key]: value });
    }, 150);
  });

  // Number input → sync slider + save
  numberInput.addEventListener('input', () => {
    let value = parseInt(numberInput.value);
    if (isNaN(value)) return;
    value = Math.max(50, Math.min(100, value));
    slider.value = value;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      chrome.storage.sync.set({ [site.key]: value });
    }, 150);
  });

  // On blur → validate or clear
  numberInput.addEventListener('blur', () => {
    const raw = numberInput.value.trim();
    if (!raw) {
      slider.value = 50;
      chrome.storage.sync.remove(site.key);
      return;
    }
    let value = parseInt(raw);
    if (isNaN(value) || value < 50) {
      numberInput.value = '';
      slider.value = 50;
      chrome.storage.sync.remove(site.key);
    } else {
      value = Math.min(100, value);
      numberInput.value = value;
      slider.value = value;
      chrome.storage.sync.set({ [site.key]: value });
    }
  });
}

// ── Reset button ───────────────────────────────────────────────
document.getElementById('reset-btn').addEventListener('click', () => {
  chrome.storage.sync.remove(SITES.map(s => s.key), () => {
    for (const site of SITES) {
      document.getElementById(`${site.key}_slider`).value = 50;
      document.getElementById(`${site.key}_number`).value = '';
    }
  });
});
