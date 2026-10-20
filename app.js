(() => {
  'use strict';

  const defaults = structuredClone(window.GIFT_CONFIG || {});
  const storageKey = 'thiep2010-personalization-v1';
  const app = document.querySelector('#app');
  const state = {
    screen: 'cover',
    config: loadConfig(),
    shareId: window.location.hash.match(/(?:^#|&)sid=([^&]+)/)?.[1] || '',
    shareUrl: '',
    photos: [],
    audioUrl: '',
    backgroundUrl: '',
    bloomTimer: null,
    fadeTimer: null,
    toastTimer: null
  };

  const $ = (selector) => document.querySelector(selector);
  const screens = [...document.querySelectorAll('[data-scene]')];

  function loadConfig() {
    try {
      const shared = readSharedConfig();
      if (shared) return mergeConfig(defaults, shared);
      const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
      return saved ? mergeConfig(defaults, saved) : mergeConfig(defaults, {});
    } catch (error) {
      console.warn('Không đọc được cấu hình lưu cục bộ:', error);
      return mergeConfig(defaults, {});
    }
  }

  function readSharedConfig() {
    const match = window.location.hash.match(/(?:^#|&)gift=([^&]+)/);
    if (!match) return null;
    try {
      let raw = match[1].replace(/-/g, '+').replace(/_/g, '/');
      raw += '='.repeat((4 - raw.length % 4) % 4);
      return JSON.parse(decodeURIComponent(escape(atob(raw))));
    } catch (error) {
      console.warn('Link thiệp không hợp lệ:', error);
      return null;
    }
  }

  function createShareId() {
    return window.crypto?.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
  }

  function encodeSharedConfig(config) {
    const json = JSON.stringify(config);
    return btoa(unescape(encodeURIComponent(json))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  }

  function mergeConfig(base, patch) {
    return {
      ...base,
      ...patch,
      photos: Array.isArray(patch.photos) && patch.photos.length ? patch.photos : (base.photos || [])
    };
  }

  function persistConfig() {
    const serializable = { ...state.config, photos: state.config.photos.map(({ src, caption, note }) => ({ src, caption, note })) };
    try { localStorage.setItem(storageKey, JSON.stringify(serializable)); } catch (error) { console.warn('localStorage đầy:', error); }
  }

  function showToast(message) {
    const toast = $('#toast');
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(state.toastTimer);
    state.toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 3000);
  }

  function setScreen(name) {
    state.screen = name;
    app.dataset.screen = name;
    screens.forEach((scene) => {
      const active = scene.dataset.scene === name;
      scene.hidden = !active;
      scene.classList.toggle('is-active', active);
    });
  }

  function createStars() {
    const stars = $('#stars');
    const seed = [4, 9, 15, 21, 28, 34, 41, 47, 55, 62, 69, 76, 82, 89, 95, 12, 58, 73, 37, 66, 25, 84, 45, 18, 92, 52, 31, 7, 79, 49];
    stars.innerHTML = seed.map((left, index) => {
      const top = 5 + ((index * 17) % 54);
      const size = index % 6 === 0 ? 3 : index % 3 === 0 ? 2.5 : 1.6;
      return `<span class="star" style="left:${left}%;top:${top}%;--size:${size}px;--delay:${(index % 7) * .38}s;--twinkle:${2 + (index % 4) * .6}s;--opacity:${.4 + (index % 5) * .1}"></span>`;
    }).join('');
  }

  function createPetals() {
    $('#petals').innerHTML = Array.from({ length: 9 }, (_, index) => `<span class="petal" style="left:${8 + index * 11}%;--delay:${index * -1.7}s;--duration:${7 + index % 4}s;--drift:${index % 2 ? -45 : 45}px"></span>`).join('');
  }

  function flowerMarkup() {
    return '<div class="tulip"><i></i><i></i><i></i><i></i><i></i></div>';
  }

  function bouquetMarkup(className = 'bouquet-flowers') {
    const positions = [
      [-112, 84, .7, -24, -9], [-82, 123, .82, -17, -6], [-52, 157, .9, -11, -3], [-18, 178, 1, -5, -1], [18, 180, 1, 4, 2], [54, 157, .9, 11, 4], [84, 123, .82, 18, 7], [112, 84, .7, 25, 10], [-70, 73, .73, -18, -6], [-35, 111, .88, -8, -2], [4, 132, .96, 1, 0], [43, 111, .88, 9, 3], [72, 72, .72, 18, 7], [0, 204, .72, 0, 0]
    ];
    return positions.map(([x, y, s, r, stemR], index) => `<div class="bouquet-flower" style="--x:${x}px;--y:${y}px;--s:${s};--r:${r}deg;--stem-r:${stemR}deg;--delay:${index * .18 + .1}s">${flowerMarkup()}</div>`).join('');
  }

  function prepareBloom() {
    $('#bouquetFlowers').innerHTML = bouquetMarkup();
    $('#fadeBouquetFlowers').innerHTML = bouquetMarkup('fade-bouquet-flowers');
    $('#bloomGreeting').textContent = state.config.greeting;
    $('#bloomTitle').innerHTML = `${escapeHtml(state.config.title).replace('20/10', '<em>20/10</em>')}`;
    $('#letterHeading').textContent = `Gửi ${state.config.recipient}, người anh yêu`;
    $('#letterBody').textContent = state.config.letter;
    $('#letterSignature').innerHTML = `Thương ${escapeHtml(state.config.recipient)} thật nhiều,<br /><strong>${escapeHtml(state.config.sender)}</strong>`;
    $('#galleryHeading').innerHTML = `Vẫn gần ${escapeHtml(state.config.recipient)},<br /><em>dù xa cách</em>`;
  }

  function beginBloom() {
    setScreen('bloom');
    const bloom = $('#scene-bloom');
    bloom.classList.remove('is-bouquet');
    $('#bloomActions').hidden = true;
    prepareBloom();
    clearTimeout(state.bloomTimer);
    state.bloomTimer = setTimeout(() => {
      bloom.classList.add('is-bouquet');
      state.bloomTimer = setTimeout(() => { $('#bloomActions').hidden = false; }, 3200);
    }, 1700);
  }

  function startFade() {
    setScreen('fade');
    clearTimeout(state.fadeTimer);
    state.fadeTimer = setTimeout(() => {
      setScreen('gallery');
      renderGallery();
    }, 5200);
  }

  function safeUrl(src) {
    if (!src) return '';
    return src;
  }

  function placeholderData(index) {
    const palettes = [
      ['#ffbfdc', '#6845a6'], ['#ffc796', '#de6386'], ['#c7dcff', '#2e61c7'], ['#e6baff', '#8c54b6'],
      ['#a8f1e2', '#2672ac'], ['#ffe0a8', '#b84e72'], ['#a8d5ff', '#244ea4'], ['#f8b5d0', '#6b3c9e'],
      ['#b4ebef', '#3972ba'], ['#ffd4ed', '#bd507d'], ['#b9e0bd', '#4a5fa6'], ['#dfc6ff', '#4a3b9e']
    ];
    const [a, b] = palettes[index % palettes.length];
    const label = encodeURIComponent(`${index + 1}`);
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 310"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="240" height="310" rx="10" fill="url(#g)"/><circle cx="120" cy="112" r="47" fill="rgba(255,255,255,.32)"/><path d="M65 239c18-61 93-66 111 0" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="19" stroke-linecap="round"/><text x="120" y="278" text-anchor="middle" fill="white" font-family="sans-serif" font-size="15" letter-spacing="3">ẢNH ${label}</text></svg>`)}`;
  }

  function normalizePhotos() {
    const source = Array.isArray(state.config.photos) && state.config.photos.length ? state.config.photos : defaults.photos;
    state.photos = source.map((photo, index) => ({
      src: safeUrl(photo.src) || placeholderData(index),
      originalSrc: safeUrl(photo.src),
      caption: photo.caption || `Khoảnh khắc ${index + 1}`,
      note: photo.note || 'Ảnh của chúng mình',
      placeholder: !photo.src
    }));
  }

  function renderGallery() {
    normalizePhotos();
    const track = $('#galleryTrack');
    track.innerHTML = state.photos.map((photo, index) => {
      const left = [4, 60, 35, 73, 12, 48, 80, 24, 66, 2, 43, 79][index % 12];
      const width = [82, 91, 109, 76, 90, 101, 84][index % 7];
      const height = Math.round(width * 1.24);
      const rotate = [-8, 7, -3, 10, -11, 4, -6, 12][index % 8];
      const duration = 8.5 + (index % 5) * .55;
      const delay = -(index * 1.65);
      const drift = index % 2 ? '-22px' : '18px';
      return `<figure class="memory-card ${photo.placeholder ? 'is-placeholder' : ''}" style="--left:${left}%;--width:${width}px;--height:${height}px;--rotate:${rotate}deg;--duration:${duration}s;--delay:${delay}s;--drift:${drift};--photo-a:${index % 2 ? '#4c68ad' : '#db7ca5'};--photo-b:${index % 2 ? '#59bee4' : '#f4c3d5'}"><img loading="lazy" decoding="async" src="${escapeAttr(photo.src)}" alt="${escapeAttr(photo.caption)}" /><figcaption>${escapeHtml(photo.caption)}<span>${escapeHtml(photo.note)}</span></figcaption></figure>`;
    }).join('');
    track.querySelectorAll('img').forEach((image, index) => image.addEventListener('error', () => {
      image.src = placeholderData(index);
      image.closest('.memory-card')?.classList.add('is-placeholder');
    }, { once: true }));
  }

  function escapeHtml(value) { return String(value || '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char])); }
  function escapeAttr(value) { return escapeHtml(value).replace(/`/g, '&#96;'); }

  function setAudioSource(src) {
    const audio = $('#bgMusic');
    if (state.audioUrl) URL.revokeObjectURL(state.audioUrl);
    state.audioUrl = '';
    audio.pause();
    audio.removeAttribute('src');
    if (!src) return;
    audio.src = src;
    audio.load();
  }

  function applyBackground(src) {
    const background = $('#customBackground');
    if (state.backgroundUrl) URL.revokeObjectURL(state.backgroundUrl);
    state.backgroundUrl = '';
    if (src) {
      background.style.backgroundImage = `url("${src.replace(/"/g, '')}")`;
      background.classList.add('has-image');
    } else {
      background.style.backgroundImage = '';
      background.classList.remove('has-image');
    }
  }

  function openSettings() { $('#settingsPanel').classList.add('is-open'); $('#settingsPanel').setAttribute('aria-hidden', 'false'); $('#settingsScrim').hidden = false; }
  function closeSettings() { $('#settingsPanel').classList.remove('is-open'); $('#settingsPanel').setAttribute('aria-hidden', 'true'); $('#settingsScrim').hidden = true; }

  function fillForm() {
    $('#recipientInput').value = state.config.recipient || '';
    $('#senderInput').value = state.config.sender || '';
    $('#titleInput').value = state.config.title || '';
    $('#greetingInput').value = state.config.greeting || '';
    $('#letterInput').value = state.config.letter || '';
    renderPhotoList();
  }

  function renderPhotoList() {
    const list = $('#photoList');
    const photos = state.config.photos || [];
    list.innerHTML = photos.map((photo, index) => `<div class="photo-list__item"><img src="${escapeAttr(photo.src || placeholderData(index))}" alt="" /><span>${escapeHtml(photo.caption || `Ảnh ${index + 1}`)}</span><button type="button" data-remove-photo="${index}" aria-label="Xóa ảnh ${index + 1}">×</button></div>`).join('');
    list.querySelectorAll('[data-remove-photo]').forEach((button) => button.addEventListener('click', () => {
      state.config.photos.splice(Number(button.dataset.removePhoto), 1);
      renderPhotoList();
    }));
  }

  function readFileAsDataUrl(file) { return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file); }); }

  async function compressImage(file, maxEdge = 1280) {
    if (!file.type.startsWith('image/') || !window.createImageBitmap) return readFileAsDataUrl(file);
    try {
      const bitmap = await createImageBitmap(file);
      const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close?.();
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', .76));
      return blob ? readFileAsDataUrl(blob) : readFileAsDataUrl(file);
    } catch (error) {
      console.warn('Không nén được ảnh, dùng ảnh gốc:', error);
      return readFileAsDataUrl(file);
    }
  }

  function createShareLink(makeNewId = false) {
    if (makeNewId || !state.shareId) state.shareId = createShareId();
    state.shareUrl = `${window.location.origin}${window.location.pathname}${window.location.search}#gift=${encodeSharedConfig(state.config)}&sid=${encodeURIComponent(state.shareId)}`;
    window.history.replaceState(null, '', state.shareUrl);
    $('#shareResult').hidden = false;
    $('#shareLinkOutput').value = state.shareUrl;
    $('#shareLinkNote').textContent = state.shareUrl.length > 1800000
      ? 'Link quá dài để gửi thuận tiện. Hãy dùng ảnh nhỏ hơn hoặc đặt ảnh/nhạc trong assets/ rồi tạo link mới.'
      : 'Link chứa nội dung thiệp riêng của bạn. Gửi link này để người nhận mở đúng phiên bản đã lưu.';
    return state.shareUrl;
  }

  async function copyText(text) {
    try {
      if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(text); return true; }
    } catch (error) { console.warn('Không dùng được clipboard API:', error); }
    const input = $('#shareLinkOutput');
    input.focus(); input.select(); input.setSelectionRange(0, input.value.length);
    try { return document.execCommand('copy'); } catch (error) { return false; }
  }

  async function copyPersonalLink() {
    const copied = await copyText($('#shareLinkOutput').value);
    showToast(copied ? 'Đã sao chép link riêng của bạn.' : 'Hãy nhấn giữ link để sao chép.');
  }

  async function sendPersonalLink() {
    const url = $('#shareLinkOutput').value || createShareLink();
    if (navigator.share) {
      try { await navigator.share({ title: 'Thiệp 20/10 của riêng mình', text: `Một món quà dành cho ${state.config.recipient}`, url }); }
      catch (error) { if (error.name !== 'AbortError') showToast('Chưa gửi được; bạn có thể sao chép link.'); }
      return;
    }
    await copyPersonalLink();
  }

  async function handleSettingsSubmit(event) {
    event.preventDefault();
    const submitButton = $('#settingsForm button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = 'Đang lưu và tạo link…';
    try {
    state.config.recipient = $('#recipientInput').value.trim() || defaults.recipient;
    state.config.sender = $('#senderInput').value.trim() || defaults.sender;
    state.config.title = $('#titleInput').value.trim() || defaults.title;
    state.config.greeting = $('#greetingInput').value.trim() || defaults.greeting;
    state.config.letter = $('#letterInput').value.trim() || defaults.letter;
    const backgroundFile = $('#backgroundInput').files[0];
    const musicFile = $('#musicInput').files[0];
    const photoFiles = [...$('#photosInput').files];
    if (backgroundFile) {
      if (backgroundFile.type.startsWith('image/')) state.config.background = await compressImage(backgroundFile, 1600);
      else showToast('Ảnh nền cần là một tệp hình ảnh.');
    }
    if (musicFile) {
      if (!musicFile.type || musicFile.type.startsWith('audio/')) state.config.music = await readFileAsDataUrl(musicFile);
      else showToast('Nhạc nền cần là một tệp âm thanh.');
    }
    if (photoFiles.length) {
      const validFiles = photoFiles.filter((file) => file.type.startsWith('image/'));
      if (validFiles.length !== photoFiles.length) showToast('Đã bỏ qua tệp không phải ảnh.');
      const added = [];
      for (const [index, file] of validFiles.entries()) {
        const src = await compressImage(file, 1280);
        added.push({ src, caption: file.name.replace(/\.[^.]+$/, '') || `Ảnh ${state.config.photos.length + index + 1}`, note: 'Ảnh của chúng mình' });
      }
      state.config.photos = [...(state.config.photos || []), ...added];
    }
    persistConfig();
    setAudioSource(state.config.music);
    applyBackground(state.config.background);
    prepareBloom();
    renderPhotoList();
    $('#backgroundInput').value = '';
    $('#musicInput').value = '';
    $('#photosInput').value = '';
    createShareLink(true);
    showToast('Đã lưu và tạo link riêng. Bạn có thể sao chép hoặc gửi ngay.');
    $('#shareResult').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    } catch (error) {
      console.error('Không lưu được thiệp:', error);
      showToast('Chưa lưu được một số tệp. Hãy thử ảnh/nhạc nhỏ hơn.');
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = 'Lưu và tạo link riêng';
    }
  }

  function resetConfig() {
    state.config = mergeConfig(defaults, {});
    persistConfig();
    setAudioSource(''); applyBackground(''); fillForm(); prepareBloom();
    showToast('Đã khôi phục nội dung mẫu.');
  }

  function exportConfig() {
    const blob = new Blob([`window.GIFT_CONFIG = ${JSON.stringify(state.config, null, 2)};`], { type: 'text/javascript;charset=utf-8' });
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'config.js'; link.click(); URL.revokeObjectURL(link.href);
    showToast('Đã tải file config.js để đưa lên GitHub.');
  }

  async function shareCard() {
    const url = createShareLink();
    if (url.length > 1800000) showToast('Link rất dài vì có ảnh/nhạc nhúng; nên đặt file vào assets/ để link nhẹ hơn.');
    const shareData = { title: 'Một món quà 20/10', text: `Một món quà dành cho ${state.config.recipient}`, url };
    try {
      if (navigator.share) { await navigator.share(shareData); showToast('Đã tạo link riêng cho người nhận.'); } else { await navigator.clipboard.writeText(url); showToast('Đã copy link riêng của thiệp.'); }
    } catch (error) { if (error.name !== 'AbortError') { await navigator.clipboard?.writeText(url); showToast('Đã copy link riêng của thiệp.'); } }
  }

  function toggleMusic() {
    const audio = $('#bgMusic');
    if (!audio.src) { showToast('Chưa có nhạc. Hãy chọn file nhạc trong phần ✦.'); openSettings(); return; }
    if (audio.paused) {
      audio.play().then(() => { $('#musicToggle').classList.add('is-on'); $('#musicToggle').textContent = '♫'; $('#musicToggle').setAttribute('aria-label', 'Tắt nhạc'); }).catch(() => showToast('Trình duyệt cần bạn chạm lại nút nhạc.'));
    } else { audio.pause(); $('#musicToggle').classList.remove('is-on'); $('#musicToggle').setAttribute('aria-label', 'Bật nhạc'); }
  }

  function bindEvents() {
    window.addEventListener('hashchange', () => {
      const shared = readSharedConfig();
      if (!shared) return;
      state.config = mergeConfig(defaults, shared);
      state.shareId = window.location.hash.match(/(?:^#|&)sid=([^&]+)/)?.[1] || '';
      state.shareUrl = `${window.location.origin}${window.location.pathname}${window.location.search}${window.location.hash}`;
      fillForm();
      prepareBloom();
      setAudioSource(state.config.music || '');
      applyBackground(state.config.background || '');
      $('#shareResult').hidden = true;
      if (state.screen === 'gallery') renderGallery();
      showToast('Đã mở nội dung của link thiệp này.');
    });
    $('#openGift').addEventListener('click', () => { if ($('#bgMusic').src) $('#bgMusic').play().catch(() => {}); beginBloom(); });
    $('#readLetter').addEventListener('click', () => setScreen('letter'));
    $('#closeLetter').addEventListener('click', () => setScreen('bloom'));
    $('#continueToAlbum').addEventListener('click', startFade);
    $('#musicToggle').addEventListener('click', toggleMusic);
    $('#settingsToggle').addEventListener('click', openSettings);
    $('#closeSettings').addEventListener('click', closeSettings);
    $('#settingsScrim').addEventListener('click', closeSettings);
    $('#settingsForm').addEventListener('submit', handleSettingsSubmit);
    $('#resetButton').addEventListener('click', resetConfig);
    $('#exportButton').addEventListener('click', exportConfig);
    $('#restartButton').addEventListener('click', () => { clearTimeout(state.bloomTimer); clearTimeout(state.fadeTimer); setScreen('cover'); });
    $('#shareButton').addEventListener('click', shareCard);
    $('#copyShareLink').addEventListener('click', copyPersonalLink);
    $('#sendShareLink').addEventListener('click', sendPersonalLink);
    $('#photosInput').addEventListener('change', () => showToast(`${$('#photosInput').files.length} ảnh đã sẵn sàng để thêm.`));
    $('#backgroundInput').addEventListener('change', () => showToast('Ảnh nền sẽ phủ nhẹ lên nền xanh mẫu.'));
    $('#musicInput').addEventListener('change', () => showToast('Nhạc sẽ phát sau khi bạn chạm mở quà.'));
  }

  createStars(); createPetals(); fillForm(); prepareBloom(); bindEvents();
  setAudioSource(state.config.music || ''); applyBackground(state.config.background || '');
})();
