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
    ownerUrl: '',
    recipientView: false,
    photoProcessing: Promise.resolve(),
    isDirty: false,
    photos: [],
    galleryIndex: 0,
    galleryTouchStartX: null,
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

  function isRecipientViewRequested() {
    return new URLSearchParams(window.location.hash.slice(1)).get('view') === 'recipient';
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
      photos: Array.isArray(patch.photos) ? patch.photos : (base.photos || [])
    };
  }

  function persistConfig() {
    const serializable = { ...state.config, photos: state.config.photos.map(({ src, caption, note, fit, position }) => ({ src, caption, note, fit, position })) };
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
    stars.innerHTML = Array.from({ length: 86 }, (_, index) => {
      const left = 3 + ((index * 37.73) % 94);
      const top = 3 + ((index * 23 + (index % 7) * 5) % 64);
      const size = index % 13 === 0 ? 3 : index % 4 === 0 ? 2 : 1;
      return `<span class="star" style="left:${left.toFixed(2)}%;top:${top}%;--size:${size}px;--delay:${(index % 11) * .23}s;--twinkle:${1.8 + (index % 5) * .55}s;--opacity:${.34 + (index % 6) * .1}"></span>`;
    }).join('');
  }

  function createWindGrass() {
    $('#windGrass').innerHTML = Array.from({ length: 56 }, (_, index) => {
      const left = ((index * 47.7) % 104) - 2;
      const height = 24 + (index * 19 % 74);
      const width = index % 5 === 0 ? 3 : index % 3 === 0 ? 2 : 1;
      return `<span style="left:${left.toFixed(1)}%;height:${height}px;width:${width}px;--lean:${-2 + index % 5}deg;--sway:${1 + (index % 3) * .4}deg;--duration:${5.8 + (index % 8) * .45}s;--delay:${-((index % 13) * .31)}s;--green:${119 + index % 55}"></span>`;
    }).join('');
  }

  function createPetals() {
    $('#petals').innerHTML = Array.from({ length: 9 }, (_, index) => `<span class="petal" style="left:${8 + index * 11}%;--delay:${index * -1.7}s;--duration:${7 + index % 4}s;--drift:${index % 2 ? -45 : 45}px"></span>`).join('');
  }

  function bouquetMarkup(alt = '', withRise = true) {
    const glow = withRise ? '<span class="bouquet-halo" aria-hidden="true"></span>' : '';
    return `${glow}<img class="bouquet-art" src="./assets/tulip-bouquet-20-10.webp" alt="${escapeAttr(alt)}" decoding="async" />`;
  }

  function prepareBloom() {
    $('#bouquetFlowers').innerHTML = bouquetMarkup('Bó tulip hồng được gói giấy kem và thắt nơ hồng.');
    $('#coverEyebrow').textContent = state.config.coverEyebrow;
    $('#coverTitle').innerHTML = titleMarkup(state.config.title);
    const hintLines = String(state.config.coverHint || '').split(/\r?\n/);
    $('#coverHint').innerHTML = `${escapeHtml(hintLines.shift() || '')}${hintLines.length ? `<br /><span>${escapeHtml(hintLines.join('\n')).replace(/\n/g, '<br />')}</span>` : ''}`;
    $('#openGift').setAttribute('aria-label', state.config.openGiftLabel);
    $('#bloomGreeting').textContent = state.config.greeting;
    $('#bloomTitle').innerHTML = titleMarkup(state.config.title);
    $('#readLetterLabel').textContent = state.config.readLetterLabel;
    $('#letterEyebrow').textContent = state.config.letterEyebrow;
    $('#letterHeading').innerHTML = lineMarkup(state.config.letterHeading);
    $('#letterBody').textContent = state.config.letter;
    $('#letterSignature').innerHTML = signatureMarkup(state.config.signature);
    $('#continueToAlbumLabel').textContent = state.config.continueToAlbumLabel;
    $('#fadeMessage').innerHTML = emphasizedLinesMarkup(state.config.fadeMessage);
    $('#galleryEyebrow').textContent = state.config.galleryEyebrow;
    $('#galleryHeading').innerHTML = emphasizedLinesMarkup(state.config.galleryHeading);
    $('#galleryHint').textContent = state.config.galleryHint;
    $('#restartLabel').textContent = state.config.restartLabel;
    $('#shareLabel').textContent = state.config.shareLabel;
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
      state.bloomTimer = setTimeout(() => { $('#bloomActions').hidden = false; }, 2650);
    }, 420);
  }

  function startFade() {
    setScreen('fade');
    clearTimeout(state.fadeTimer);
    const fadeScene = $('#scene-fade');
    fadeScene.classList.remove('is-exiting');
    state.fadeTimer = setTimeout(() => {
      fadeScene.classList.add('is-exiting');
      state.fadeTimer = setTimeout(() => {
        state.galleryIndex = 0;
        renderGallery();
        setScreen('gallery');
      }, 420);
    }, 850);
  }

  function safeUrl(src) {
    if (typeof src !== 'string' || !src.trim()) return '';
    const value = src.trim();
    if (/^data:image\/[a-z0-9.+-]+(?:;[^,]*)?,/i.test(value)) return value;
    try {
      const url = new URL(value, window.location.href);
      return ['http:', 'https:'].includes(url.protocol) ? value : '';
    } catch {
      return '';
    }
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
    const source = Array.isArray(state.config.photos) ? state.config.photos : (defaults.photos || []);
    state.photos = source.filter((photo) => photo && typeof photo.src === 'string' && photo.src.trim() && safeUrl(photo.src)).map((photo, index) => ({
      src: safeUrl(photo.src),
      originalSrc: safeUrl(photo.src),
      caption: photo.caption || `Khoảnh khắc ${index + 1}`,
      note: photo.note || 'Ảnh của chúng mình',
      fit: photo.fit === 'cover' ? 'cover' : 'contain',
      position: ['center', 'top', 'bottom', 'left', 'right'].includes(photo.position) ? photo.position : 'center',
      placeholder: false
    }));
    state.galleryIndex = state.photos.length ? ((state.galleryIndex % state.photos.length) + state.photos.length) % state.photos.length : 0;
  }

  function renderGallery() {
    normalizePhotos();
    const track = $('#galleryTrack');
    $('#galleryHint').hidden = state.photos.length === 0;
    if (!state.photos.length) {
      track.innerHTML = `<div class="gallery-empty"><span aria-hidden="true">✦</span><p>${lineMarkup(state.config.galleryEmptyMessage || defaults.galleryEmptyMessage)}</p></div>`;
      return;
    }
    const index = state.galleryIndex;
    const photo = state.photos[index];
    const fit = photo.placeholder ? 'contain' : photo.fit;
    const progress = ((index + 1) / state.photos.length) * 100;
    track.innerHTML = `<figure class="memory-card ${photo.placeholder ? 'is-placeholder' : ''}" style="--photo-fit:${fit};--photo-position:${photo.position}"><img loading="eager" decoding="async" src="${escapeAttr(photo.src)}" alt="${escapeAttr(photo.caption)}" /><figcaption>${escapeHtml(photo.caption)}<span>${escapeHtml(photo.note)}</span></figcaption></figure><div class="gallery-pager"><button class="gallery-nav" type="button" data-gallery-step="-1" aria-label="Ảnh trước" ${state.photos.length < 2 ? 'disabled' : ''}>‹</button><div class="gallery-progress"><span class="gallery-count" aria-live="polite">${index + 1} / ${state.photos.length}</span><div class="gallery-progress__track" role="progressbar" aria-label="Tiến độ album" aria-valuemin="1" aria-valuemax="${state.photos.length}" aria-valuenow="${index + 1}"><span style="width:${progress}%"></span></div></div><button class="gallery-nav" type="button" data-gallery-step="1" aria-label="Ảnh tiếp theo" ${state.photos.length < 2 ? 'disabled' : ''}>›</button></div>`;
    track.querySelector('img')?.addEventListener('error', (event) => {
      event.currentTarget.src = placeholderData(index);
      event.currentTarget.closest('.memory-card')?.classList.add('is-placeholder');
    }, { once: true });
  }

  function moveGalleryPhoto(step) {
    if (state.photos.length < 2) return;
    state.galleryIndex = (state.galleryIndex + step + state.photos.length) % state.photos.length;
    renderGallery();
  }

  function escapeHtml(value) { return String(value || '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char])); }
  function escapeAttr(value) { return escapeHtml(value).replace(/`/g, '&#96;'); }
  function interpolateCopy(value) {
    return String(value || '').replace(/\{recipient\}/g, String(state.config.recipient || '')).replace(/\{sender\}/g, String(state.config.sender || ''));
  }
  function lineMarkup(value) { return escapeHtml(interpolateCopy(value)).replace(/\r?\n/g, '<br />'); }
  function titleMarkup(value) { return escapeHtml(value).replace(/20\/10/g, '<strong>20/10</strong>').replace(/\r?\n/g, '<br />'); }
  function emphasizedLinesMarkup(value) {
    const lines = interpolateCopy(value).split(/\r?\n/);
    const first = escapeHtml(lines.shift() || '');
    const rest = escapeHtml(lines.join('\n')).replace(/\n/g, '<br />');
    return `${first}${rest ? `<br /><em>${rest}</em>` : ''}`;
  }
  function signatureMarkup(value) {
    const lines = interpolateCopy(value).split(/\r?\n/);
    const finalLine = escapeHtml(lines.pop() || '');
    return `${lines.map(escapeHtml).join('<br />')}${lines.length ? '<br />' : ''}<strong>${finalLine}</strong>`;
  }

  function syncMusicButton() {
    const audio = $('#bgMusic');
    const button = $('#musicToggle');
    const playing = !audio.paused && !audio.ended;
    button.classList.toggle('is-on', playing);
    button.setAttribute('aria-label', playing ? 'Tắt nhạc' : 'Bật nhạc');
    button.title = state.config.music ? 'Bật/tắt nhạc nền' : 'Thiệp này chưa có nhạc nền';
  }

  function startMusicFromGesture() {
    const audio = $('#bgMusic');
    if (!audio.getAttribute('src')) return;
    audio.play().then(syncMusicButton).catch(() => {
      syncMusicButton();
      showToast('Nếu Messenger chặn nhạc, chạm nút ♫ hoặc chọn ⋯ → Mở bằng trình duyệt.');
    });
  }

  function setAudioSource(src) {
    const audio = $('#bgMusic');
    if (state.audioUrl) URL.revokeObjectURL(state.audioUrl);
    state.audioUrl = '';
    audio.pause();
    audio.removeAttribute('src');
    if (!src) { syncMusicButton(); return; }
    audio.src = src;
    audio.load();
    syncMusicButton();
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

  function openSettings() { if (state.recipientView) return; $('#settingsPanel').classList.add('is-open'); $('#settingsPanel').setAttribute('aria-hidden', 'false'); $('#settingsScrim').hidden = false; }
  function closeSettings() { $('#settingsPanel').classList.remove('is-open'); $('#settingsPanel').setAttribute('aria-hidden', 'true'); $('#settingsScrim').hidden = true; }

  function applyRecipientView() {
    state.recipientView = isRecipientViewRequested();
    $('#settingsToggle').hidden = state.recipientView;
    document.body.classList.toggle('is-recipient-view', state.recipientView);
    if (state.recipientView) {
      closeSettings();
      $('#shareResult').hidden = true;
    }
  }

  function fillForm() {
    $('#recipientInput').value = state.config.recipient || '';
    $('#senderInput').value = state.config.sender || '';
    $('#titleInput').value = state.config.title || '';
    $('#greetingInput').value = state.config.greeting || '';
    $('#letterInput').value = state.config.letter || '';
    const copyInputs = {
      coverEyebrow: 'coverEyebrowInput', coverHint: 'coverHintInput', openGiftLabel: 'openGiftLabelInput',
      readLetterLabel: 'readLetterLabelInput', letterEyebrow: 'letterEyebrowInput', letterHeading: 'letterHeadingInput',
      signature: 'signatureInput', continueToAlbumLabel: 'continueToAlbumLabelInput', fadeMessage: 'fadeMessageInput',
      galleryEyebrow: 'galleryEyebrowInput', galleryHeading: 'galleryHeadingInput',
      galleryHint: 'galleryHintInput', galleryEmptyMessage: 'galleryEmptyMessageInput', restartLabel: 'restartLabelInput', shareLabel: 'shareLabelInput'
    };
    for (const [key, id] of Object.entries(copyInputs)) $(`#${id}`).value = state.config[key] || defaults[key] || '';
    renderPhotoList();
    updateMediaStatus();
  }

  function renderPhotoList() {
    const list = $('#photoList');
    const photos = state.config.photos || [];
    if (!photos.length) {
      list.innerHTML = '<p class="photo-list__empty">Chưa có ảnh trong album. Chọn ảnh ở mục bên trên để thêm.</p>';
      return;
    }
    list.innerHTML = `<div class="photo-list__heading"><strong>Ảnh trong album · ${photos.length}</strong><button id="clearPhotos" class="photo-clear-all" type="button">Xóa tất cả</button></div>` + photos.map((photo, index) => {
      const fit = photo.fit === 'cover' ? 'cover' : 'contain';
      const position = ['center', 'top', 'bottom', 'left', 'right'].includes(photo.position) ? photo.position : 'center';
      const positions = [['center', 'Giữa'], ['top', 'Trên'], ['bottom', 'Dưới'], ['left', 'Trái'], ['right', 'Phải']];
      return `<article class="photo-list__item"><img data-photo-preview="${index}" src="${escapeAttr(photo.src || placeholderData(index))}" alt="Xem trước ${index + 1}" style="object-fit:${fit};object-position:${position}" /><div class="photo-list__fields"><label class="photo-edit-field">Chú thích<input type="text" data-photo-caption="${index}" value="${escapeAttr(photo.caption || `Ảnh ${index + 1}`)}" aria-label="Chú thích ảnh ${index + 1}" /></label><label class="photo-edit-field">Ghi chú<input type="text" data-photo-note="${index}" value="${escapeAttr(photo.note || '')}" aria-label="Ghi chú ảnh ${index + 1}" /></label><div class="photo-list__view"><label class="photo-edit-field">Cách hiển thị<select data-photo-fit="${index}" aria-label="Cách hiển thị ảnh ${index + 1}"><option value="contain" ${fit === 'contain' ? 'selected' : ''}>Vừa khung · không cắt</option><option value="cover" ${fit === 'cover' ? 'selected' : ''}>Phủ khung · có thể cắt</option></select></label><label class="photo-edit-field">Canh ảnh<select data-photo-position="${index}" aria-label="Canh ảnh ${index + 1}">${positions.map(([value, label]) => `<option value="${value}" ${position === value ? 'selected' : ''}>${label}</option>`).join('')}</select></label></div></div><div class="photo-list__controls"><button type="button" data-move-photo="up:${index}" aria-label="Đưa ảnh ${index + 1} lên trước" ${index === 0 ? 'disabled' : ''}>↑</button><button type="button" data-move-photo="down:${index}" aria-label="Đưa ảnh ${index + 1} xuống sau" ${index === photos.length - 1 ? 'disabled' : ''}>↓</button><label class="photo-add-after" title="Thêm ảnh ngay sau mục này">+<input type="file" data-insert-photo-after="${index}" accept="image/*" aria-label="Thêm ảnh sau ảnh ${index + 1}" /></label><label class="photo-replace" title="Thay ảnh">Đổi<input type="file" data-replace-photo="${index}" accept="image/*" aria-label="Thay ảnh ${index + 1}" /></label><button type="button" data-remove-photo="${index}" aria-label="Xóa ảnh ${index + 1}">×</button></div></article>`;
    }).join('');
    list.querySelectorAll('[data-photo-caption]').forEach((input) => input.addEventListener('input', () => { state.config.photos[Number(input.dataset.photoCaption)].caption = input.value; }));
    list.querySelectorAll('[data-photo-note]').forEach((input) => input.addEventListener('input', () => { state.config.photos[Number(input.dataset.photoNote)].note = input.value; }));
    list.querySelectorAll('[data-photo-fit]').forEach((select) => select.addEventListener('change', () => {
      const index = Number(select.dataset.photoFit);
      state.config.photos[index].fit = select.value === 'cover' ? 'cover' : 'contain';
      const preview = list.querySelector(`[data-photo-preview="${index}"]`);
      if (preview) preview.style.objectFit = state.config.photos[index].fit;
      markShareDirty();
    }));
    list.querySelectorAll('[data-photo-position]').forEach((select) => select.addEventListener('change', () => {
      const index = Number(select.dataset.photoPosition);
      const position = ['center', 'top', 'bottom', 'left', 'right'].includes(select.value) ? select.value : 'center';
      state.config.photos[index].position = position;
      const preview = list.querySelector(`[data-photo-preview="${index}"]`);
      if (preview) preview.style.objectPosition = position;
      markShareDirty();
    }));
    list.querySelectorAll('[data-remove-photo]').forEach((button) => button.addEventListener('click', () => {
      state.config.photos.splice(Number(button.dataset.removePhoto), 1);
      markShareDirty();
      renderPhotoList();
    }));
    list.querySelectorAll('[data-move-photo]').forEach((button) => button.addEventListener('click', () => {
      const [direction, rawIndex] = button.dataset.movePhoto.split(':');
      const index = Number(rawIndex);
      const target = direction === 'up' ? index - 1 : index + 1;
      if (target < 0 || target >= state.config.photos.length) return;
      [state.config.photos[index], state.config.photos[target]] = [state.config.photos[target], state.config.photos[index]];
      markShareDirty();
      renderPhotoList();
    }));
    list.querySelectorAll('[data-insert-photo-after]').forEach((input) => input.addEventListener('change', () => {
      const file = input.files[0];
      const index = Number(input.dataset.insertPhotoAfter);
      const anchor = state.config.photos[index];
      input.value = '';
      if (!file || !file.type.startsWith('image/')) { showToast('Chọn một tệp ảnh để chèn vào album.'); return; }
      if (!anchor) return;
      markShareDirty();
      state.photoProcessing = state.photoProcessing.then(async () => {
        const src = await compressImage(file, 1280);
        const anchorIndex = state.config.photos.indexOf(anchor);
        if (anchorIndex < 0) { showToast('Mục ảnh đã thay đổi. Hãy chọn vị trí chèn lại.'); return; }
        state.config.photos.splice(anchorIndex + 1, 0, { src, caption: file.name.replace(/\.[^.]+$/, '') || `Ảnh ${anchorIndex + 2}`, note: 'Ảnh của chúng mình', fit: 'contain', position: 'center' });
        renderPhotoList();
        showToast(`Đã chèn ảnh sau mục ${anchorIndex + 1}. Bấm lưu để cập nhật link.`);
      }).catch((error) => {
        console.error('Không chèn được ảnh:', error);
        showToast('Không đọc được ảnh này. Hãy chọn tệp ảnh khác.');
      });
    }));
    list.querySelectorAll('[data-replace-photo]').forEach((input) => input.addEventListener('change', async () => {
      const file = input.files[0];
      const index = Number(input.dataset.replacePhoto);
      if (!file || !file.type.startsWith('image/')) { showToast('Chọn một tệp ảnh để thay ảnh này.'); return; }
      markShareDirty();
      try {
        state.config.photos[index].src = await compressImage(file, 1280);
        renderPhotoList();
        showToast('Đã thay ảnh. Bấm lưu để cập nhật link riêng.');
      } catch (error) { showToast('Không đọc được ảnh này. Hãy thử tệp ảnh khác.'); }
    }));
    $('#clearPhotos').addEventListener('click', () => {
      state.config.photos = [];
      markShareDirty();
      renderPhotoList();
      showToast('Đã xóa ảnh khỏi album. Bấm lưu để cập nhật link.');
    });
  }

  function updateMediaStatus() {
    $('#backgroundStatus').textContent = state.config.background ? 'Đã có ảnh nền tùy chỉnh.' : 'Đang dùng nền xanh đêm mặc định.';
    $('#musicStatus').textContent = state.config.music ? 'Đã có nhạc nền. Nhạc phát sau khi chạm mở quà.' : 'Chưa có nhạc nền.';
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

  function handlePhotoSelection() {
    const input = $('#photosInput');
    const files = [...input.files];
    input.value = '';
    const validFiles = files.filter((file) => file.type.startsWith('image/'));
    if (validFiles.length !== files.length) showToast('Đã bỏ qua tệp không phải ảnh.');
    if (!validFiles.length) return;
    markShareDirty();
    state.photoProcessing = state.photoProcessing.then(async () => {
      const added = [];
      for (const [index, file] of validFiles.entries()) {
        const src = await compressImage(file, 1280);
        added.push({ src, caption: file.name.replace(/\.[^.]+$/, '') || `Ảnh ${state.config.photos.length + index + 1}`, note: 'Ảnh của chúng mình', fit: 'contain', position: 'center' });
      }
      const existingUploads = (Array.isArray(state.config.photos) ? state.config.photos : []).filter((photo) => photo && typeof photo.src === 'string' && photo.src.trim());
      state.config.photos = [...existingUploads, ...added];
      renderPhotoList();
      showToast(`Đã thêm ${added.length} ảnh. Bạn có thể sửa, sắp xếp hoặc xóa trước khi lưu.`);
    }).catch((error) => {
      console.error('Không xử lý được ảnh đã chọn:', error);
      showToast('Không đọc được một số ảnh. Hãy chọn lại tệp ảnh nhỏ hơn.');
    });
  }

  function markShareDirty() {
    state.isDirty = true;
    if (!$('#shareResult').hidden) {
      $('#shareLinkNote').textContent = 'Có thay đổi chưa lưu. Hãy bấm “Lưu và tạo link riêng” trước khi gửi để link có nội dung mới nhất.';
      $('#copyShareLink').disabled = true;
      $('#sendShareLink').disabled = true;
    }
  }

  function createShareLink(makeNewId = false) {
    if (makeNewId || !state.shareId) state.shareId = createShareId();
    state.isDirty = false;
    state.ownerUrl = `${window.location.origin}${window.location.pathname}`;
    state.shareUrl = `${state.ownerUrl}#gift=${encodeSharedConfig(state.config)}&sid=${encodeURIComponent(state.shareId)}&view=recipient`;
    $('#shareResult').hidden = false;
    $('#ownerLinkOutput').value = state.ownerUrl;
    $('#shareLinkOutput').value = state.shareUrl;
    $('#shareLinkNote').textContent = state.shareUrl.length > 1800000
      ? 'Link quá dài để gửi thuận tiện. Hãy dùng ảnh nhỏ hơn hoặc đặt ảnh/nhạc trong assets/ rồi tạo link mới.'
      : 'Giữ link gốc để chỉnh sửa. Chỉ gửi link người nhận bên dưới — link này mở đúng thiệp đã lưu và ẩn phần cài đặt.';
    $('#copyOwnerLink').disabled = false;
    $('#copyShareLink').disabled = false;
    $('#sendShareLink').disabled = false;
    return state.shareUrl;
  }

  async function copyText(text, fallbackSelector = '#shareLinkOutput') {
    if (!text) return false;
    const fallbackInput = $(fallbackSelector);
    let nativeCopy = null;
    try {
      if (navigator.clipboard?.writeText) nativeCopy = navigator.clipboard.writeText(text);
    } catch (error) { console.warn('Không gọi được Clipboard API:', error); }

    // Chạy fallback đồng bộ ngay trong lượt chạm: nhiều webview chặn Clipboard API
    // nhưng vẫn cho phép execCommand('copy') nếu vùng chọn thuộc một textarea đang focus.
    const previousFocus = document.activeElement;
    const temporaryInput = document.createElement('textarea');
    temporaryInput.value = text;
    temporaryInput.setAttribute('readonly', '');
    temporaryInput.setAttribute('aria-hidden', 'true');
    temporaryInput.style.cssText = 'position:fixed;top:0;left:0;width:2px;height:2px;padding:0;border:0;opacity:.01;font-size:16px;z-index:-1;';
    document.body.appendChild(temporaryInput);
    temporaryInput.focus({ preventScroll: true });
    temporaryInput.select();
    temporaryInput.setSelectionRange(0, temporaryInput.value.length);
    let legacyCopied = false;
    try { legacyCopied = document.execCommand('copy') === true; }
    catch (error) { console.warn('Không dùng được execCommand copy:', error); }
    temporaryInput.remove();

    if (legacyCopied) {
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
      nativeCopy?.catch((error) => console.warn('Clipboard API bị webview chặn; đã dùng fallback:', error));
      return true;
    }
    if (nativeCopy) {
      try { await nativeCopy; return true; }
      catch (error) { console.warn('Không dùng được clipboard API:', error); }
    }
    if (fallbackInput) {
      fallbackInput.value = text;
      fallbackInput.focus({ preventScroll: true });
      fallbackInput.select();
      fallbackInput.setSelectionRange(0, fallbackInput.value.length);
    }
    return false;
  }

  async function copyOwnerLink() {
    const copied = await copyText($('#ownerLinkOutput').value, '#ownerLinkOutput');
    if (copied) showToast('Đã sao chép link gốc để chỉnh sửa.');
    else { showShareFallback($('#ownerLinkOutput').value, 'owner'); showToast('Trình duyệt chặn sao chép tự động. Nhấn giữ link trong hộp thoại rồi chọn Sao chép.'); }
  }

  async function copyPersonalLink() {
    const copied = await copyText($('#shareLinkOutput').value);
    if (copied) showToast('Đã sao chép link riêng của bạn.');
    else { showShareFallback($('#shareLinkOutput').value); showToast('Trình duyệt chặn sao chép tự động. Nhấn giữ link trong hộp thoại rồi chọn Sao chép.'); }
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
    await state.photoProcessing;
    state.config.recipient = $('#recipientInput').value.trim() || defaults.recipient;
    state.config.sender = $('#senderInput').value.trim() || defaults.sender;
    state.config.title = $('#titleInput').value.trim() || defaults.title;
    state.config.greeting = $('#greetingInput').value.trim() || defaults.greeting;
    state.config.letter = $('#letterInput').value.trim() || defaults.letter;
    const copyInputs = {
      coverEyebrow: 'coverEyebrowInput', coverHint: 'coverHintInput', openGiftLabel: 'openGiftLabelInput',
      readLetterLabel: 'readLetterLabelInput', letterEyebrow: 'letterEyebrowInput', letterHeading: 'letterHeadingInput',
      signature: 'signatureInput', continueToAlbumLabel: 'continueToAlbumLabelInput', fadeMessage: 'fadeMessageInput',
      galleryEyebrow: 'galleryEyebrowInput', galleryHeading: 'galleryHeadingInput',
      galleryHint: 'galleryHintInput', galleryEmptyMessage: 'galleryEmptyMessageInput', restartLabel: 'restartLabelInput', shareLabel: 'shareLabelInput'
    };
    for (const [key, id] of Object.entries(copyInputs)) state.config[key] = $(`#${id}`).value.trim() || defaults[key];
    const backgroundFile = $('#backgroundInput').files[0];
    const musicFile = $('#musicInput').files[0];
    if (backgroundFile) {
      if (backgroundFile.type.startsWith('image/')) state.config.background = await compressImage(backgroundFile, 1600);
      else showToast('Ảnh nền cần là một tệp hình ảnh.');
    }
    if (musicFile) {
      if (!musicFile.type || musicFile.type.startsWith('audio/')) state.config.music = await readFileAsDataUrl(musicFile);
      else showToast('Nhạc nền cần là một tệp âm thanh.');
    }
    persistConfig();
    setAudioSource(state.config.music);
    applyBackground(state.config.background);
    prepareBloom();
    renderPhotoList();
    $('#backgroundInput').value = '';
    $('#musicInput').value = '';
    $('#photosInput').value = '';
    updateMediaStatus();
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
    state.isDirty = true;
    $('#backgroundInput').value = ''; $('#musicInput').value = ''; $('#photosInput').value = '';
    persistConfig();
    setAudioSource(''); applyBackground(''); fillForm(); prepareBloom(); updateMediaStatus(); markShareDirty();
    showToast('Đã khôi phục nội dung mẫu.');
  }

  function exportConfig() {
    const blob = new Blob([`window.GIFT_CONFIG = ${JSON.stringify(state.config, null, 2)};`], { type: 'text/javascript;charset=utf-8' });
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'config.js'; link.click(); URL.revokeObjectURL(link.href);
    showToast('Đã tải file config.js để đưa lên GitHub.');
  }

  async function shareCard() {
    if (state.isDirty) { showToast('Có thay đổi chưa lưu. Hãy lưu để tạo link mới trước khi chia sẻ.'); openSettings(); return; }
    const url = createShareLink();
    if (url.length > 1800000) showToast('Link rất dài vì có ảnh/nhạc nhúng; nên đặt file vào assets/ để link nhẹ hơn.');
    const shareData = { title: 'Thiệp 20/10 — Bó hoa dưới trời sao', text: `Một món quà dành cho ${state.config.recipient}`, url };
    if (navigator.share) {
      try { await navigator.share(shareData); showToast('Đã mở bảng chia sẻ của điện thoại.'); return; }
      catch (error) { if (error.name === 'AbortError') return; console.warn('Không mở được bảng chia sẻ:', error); }
    }
    const copied = await copyText(url);
    if (copied) { showToast('Đã sao chép link riêng của thiệp.'); return; }
    showShareFallback(url);
    showToast('Không tự sao chép được. Link đã mở để bạn nhấn giữ và chọn Sao chép.');
  }

  function showShareFallback(url, kind = 'recipient') {
    const dialog = $('#shareFallbackDialog');
    const input = $('#shareFallbackLink');
    input.value = url;
    const isOwner = kind === 'owner';
    $('#shareFallbackEyebrow').textContent = isOwner ? 'LINK GỐC ĐỂ CHỈNH SỬA' : 'LINK THIỆP NGƯỜI NHẬN';
    input.setAttribute('aria-label', isOwner ? 'Link gốc để chỉnh sửa và sao chép' : 'Link người nhận để sao chép');
    $('#shareFallbackHeading').textContent = isOwner ? 'Sao chép link gốc' : 'Sao chép để gửi';
    dialog.hidden = false;
    dialog.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(() => { input.focus(); input.select(); input.setSelectionRange(0, input.value.length); });
  }

  function closeShareFallback() {
    const dialog = $('#shareFallbackDialog');
    dialog.hidden = true;
    dialog.setAttribute('aria-hidden', 'true');
    $('#shareButton').focus();
  }

  async function copyFallbackLink() {
    const copied = await copyText($('#shareFallbackLink').value, '#shareFallbackLink');
    if (copied) {
      closeShareFallback();
      showToast('Đã sao chép link.');
    } else {
      const input = $('#shareFallbackLink');
      input.focus({ preventScroll: true }); input.select(); input.setSelectionRange(0, input.value.length);
      showToast('Link đã chọn. Nhấn giữ trong ô rồi chọn Sao chép.');
    }
  }

  function toggleMusic() {
    const audio = $('#bgMusic');
    if (!audio.getAttribute('src')) {
      showToast(state.recipientView ? 'Thiệp này chưa kèm nhạc nền.' : 'Chưa có nhạc. Chọn file nhạc trong phần ✦.');
      if (!state.recipientView) openSettings();
      return;
    }
    if (audio.paused) startMusicFromGesture();
    else { audio.pause(); syncMusicButton(); }
  }

  function bindEvents() {
    window.addEventListener('hashchange', () => {
      applyRecipientView();
      const shared = readSharedConfig();
      if (!shared) return;
      state.config = mergeConfig(defaults, shared);
      state.isDirty = false;
      state.shareId = window.location.hash.match(/(?:^#|&)sid=([^&]+)/)?.[1] || '';
      state.shareUrl = `${window.location.origin}${window.location.pathname}${window.location.hash}`;
      fillForm();
      prepareBloom();
      setAudioSource(state.config.music || '');
      applyBackground(state.config.background || '');
      updateMediaStatus();
      $('#shareResult').hidden = true;
      if (state.screen === 'gallery') renderGallery();
      showToast('Đã mở nội dung của link thiệp này.');
    });
    $('#openGift').addEventListener('click', () => { startMusicFromGesture(); beginBloom(); });
    $('#readLetter').addEventListener('click', () => setScreen('letter'));
    $('#closeLetter').addEventListener('click', () => setScreen('bloom'));
    $('#continueToAlbum').addEventListener('click', startFade);
    $('#galleryTrack').addEventListener('click', (event) => {
      const button = event.target.closest('[data-gallery-step]');
      if (button && !button.disabled) moveGalleryPhoto(Number(button.dataset.galleryStep));
    });
    $('#galleryTrack').addEventListener('touchstart', (event) => { state.galleryTouchStartX = event.changedTouches[0]?.clientX ?? null; }, { passive: true });
    $('#galleryTrack').addEventListener('touchend', (event) => {
      if (state.galleryTouchStartX === null) return;
      const delta = event.changedTouches[0].clientX - state.galleryTouchStartX;
      state.galleryTouchStartX = null;
      if (Math.abs(delta) > 48) moveGalleryPhoto(delta < 0 ? 1 : -1);
    }, { passive: true });
    $('#musicToggle').addEventListener('click', toggleMusic);
    $('#bgMusic').addEventListener('playing', syncMusicButton);
    $('#bgMusic').addEventListener('pause', syncMusicButton);
    $('#settingsToggle').addEventListener('click', openSettings);
    $('#closeSettings').addEventListener('click', closeSettings);
    $('#settingsScrim').addEventListener('click', closeSettings);
    $('#settingsForm').addEventListener('submit', handleSettingsSubmit);
    $('#settingsForm').addEventListener('input', markShareDirty);
    $('#settingsForm').addEventListener('change', markShareDirty);
    $('#resetButton').addEventListener('click', resetConfig);
    $('#clearBackground').addEventListener('click', () => {
      state.config.background = '';
      markShareDirty();
      $('#backgroundInput').value = '';
      applyBackground(''); updateMediaStatus();
      showToast('Đã gỡ ảnh nền. Bấm lưu để cập nhật link riêng.');
    });
    $('#clearMusic').addEventListener('click', () => {
      state.config.music = '';
      markShareDirty();
      $('#musicInput').value = '';
      setAudioSource(''); updateMediaStatus();
      $('#musicToggle').classList.remove('is-on');
      $('#musicToggle').setAttribute('aria-label', 'Bật nhạc');
      showToast('Đã gỡ nhạc nền. Bấm lưu để cập nhật link riêng.');
    });
    $('#exportButton').addEventListener('click', exportConfig);
    $('#restartButton').addEventListener('click', () => { clearTimeout(state.bloomTimer); clearTimeout(state.fadeTimer); $('#bloomActions').hidden = true; state.galleryIndex = 0; setScreen('cover'); });
    $('#shareButton').addEventListener('click', shareCard);
    $('#closeShareFallback').addEventListener('click', closeShareFallback);
    $('#closeShareFallbackAction').addEventListener('click', closeShareFallback);
    $('#copyFallbackLink').addEventListener('click', copyFallbackLink);
    $('#shareFallbackDialog').addEventListener('click', (event) => { if (event.target === $('#shareFallbackDialog')) closeShareFallback(); });
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !$('#shareFallbackDialog').hidden) closeShareFallback(); });
    $('#copyOwnerLink').addEventListener('click', copyOwnerLink);
    $('#copyShareLink').addEventListener('click', copyPersonalLink);
    $('#sendShareLink').addEventListener('click', sendPersonalLink);
    $('#photosInput').addEventListener('change', handlePhotoSelection);
    $('#backgroundInput').addEventListener('change', () => {
      const file = $('#backgroundInput').files[0];
      $('#backgroundStatus').textContent = file ? `Ảnh nền mới: ${file.name}. Bấm lưu để áp dụng.` : (state.config.background ? 'Đã có ảnh nền tùy chỉnh.' : 'Đang dùng nền xanh đêm mặc định.');
      if (file) showToast('Ảnh nền mới sẽ được áp dụng khi bạn lưu.');
    });
    $('#musicInput').addEventListener('change', () => {
      const file = $('#musicInput').files[0];
      $('#musicStatus').textContent = file ? `Nhạc mới: ${file.name}. Bấm lưu để áp dụng.` : (state.config.music ? 'Đã có nhạc nền.' : 'Chưa có nhạc nền.');
      if (file) showToast('Nhạc mới sẽ phát sau khi bạn lưu và chạm mở quà.');
    });
  }

  createStars(); createWindGrass(); createPetals(); fillForm(); prepareBloom(); bindEvents(); applyRecipientView();
  setAudioSource(state.config.music || ''); applyBackground(state.config.background || '');
})();
