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
    recipientView: false,
    photoProcessing: Promise.resolve(),
    isDirty: false,
    photos: [],
    galleryFrame: 0,
    galleryCards: [],
    letterFrame: 0,
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
    try {
      const serializable = { ...state.config, photos: state.config.photos.map(({ src, caption, note, fit, position }) => ({ src, caption, note, fit, position })) };
      localStorage.setItem(storageKey, JSON.stringify(serializable));
      return true;
    } catch (error) {
      console.warn('Không lưu được cấu hình cục bộ:', error);
      return false;
    }
  }

  function showToast(message) {
    const toast = $('#toast');
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(state.toastTimer);
    state.toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 3000);
  }

  function setScreen(name) {
    if (name !== 'letter' && state.letterFrame) {
      cancelAnimationFrame(state.letterFrame);
      state.letterFrame = 0;
      $('#letterBody')?.classList.remove('is-writing');
    }
    state.screen = name;
    app.dataset.screen = name;
    screens.forEach((scene) => {
      const active = scene.dataset.scene === name;
      scene.hidden = !active;
      scene.classList.toggle('is-active', active);
    });
  }

  function openLetter() {
    setScreen('letter');
    const body = $('#letterBody');
    const text = String(state.config.letter || '');
    const characters = Array.from(text);
    body.textContent = '';
    body.classList.add('is-writing');
    const startedAt = performance.now();
    const duration = 3000;
    const write = (now) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const count = Math.floor(characters.length * progress);
      body.textContent = characters.slice(0, count).join('');
      if (progress < 1) state.letterFrame = requestAnimationFrame(write);
      else {
        body.textContent = text;
        body.classList.remove('is-writing');
        state.letterFrame = 0;
      }
    };
    state.letterFrame = requestAnimationFrame(write);
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

  function bouquetMarkup(alt = '', withArrivals = true) {
    const layout = [
      { x: 0, y: 35, s: .78, r: 0, stem: -4, delay: .08, flyX: 0, flyY: 150 },
      { x: -23, y: 34, s: .68, r: -17, stem: -22, delay: .31, flyX: -120, flyY: 150 },
      { x: 23, y: 34, s: .68, r: 17, stem: 22, delay: .54, flyX: 120, flyY: 150 },
      { x: -36, y: 49, s: .62, r: -24, stem: -30, delay: .77, flyX: -165, flyY: 105 },
      { x: -11, y: 50, s: .70, r: -10, stem: -12, delay: 1.00, flyX: -65, flyY: 125 },
      { x: 11, y: 50, s: .70, r: 10, stem: 12, delay: 1.23, flyX: 65, flyY: 125 },
      { x: 36, y: 49, s: .62, r: 24, stem: 30, delay: 1.46, flyX: 165, flyY: 105 },
      { x: -22, y: 64, s: .62, r: -16, stem: -20, delay: 1.69, flyX: -112, flyY: 78 },
      { x: 22, y: 64, s: .62, r: 16, stem: 20, delay: 1.92, flyX: 112, flyY: 78 },
      { x: 0, y: 75, s: .70, r: 0, stem: 0, delay: 2.15, flyX: 0, flyY: 86 }
    ];
    const tulipPetals = '<i></i>'.repeat(5);
    const arrivals = withArrivals
      ? `<div class="bouquet-arrivals" aria-hidden="true">${layout.map((flower, index) => `<div class="bouquet-flower" style="--x:${flower.x}%;--y:${flower.y}%;--s:${flower.s};--r:${flower.r}deg;--stem-r:${flower.stem}deg;--delay:${flower.delay}s;--fly-x:${flower.flyX}px;--fly-y:${flower.flyY}px;--depth:${10 - index}"><span class="bouquet-leaf bouquet-leaf--left"></span><span class="bouquet-leaf bouquet-leaf--right"></span><div class="tulip">${tulipPetals}</div></div>`).join('')}<div class="bouquet-bow" aria-hidden="true"><span class="bouquet-bow__tail bouquet-bow__tail--left"></span><span class="bouquet-bow__tail bouquet-bow__tail--right"></span><span class="bouquet-bow__loop bouquet-bow__loop--left"></span><span class="bouquet-bow__loop bouquet-bow__loop--right"></span><span class="bouquet-bow__knot"></span></div></div>`
      : '';
    return `${arrivals}<img class="bouquet-art" src="./assets/tulip-bouquet-20-10.webp" alt="${escapeAttr(alt)}" decoding="async" />`;
  }

  function prepareBloom() {
    $('#bouquetFlowers').innerHTML = bouquetMarkup('Bó tulip hồng được gói giấy kem và thắt nơ hồng.');
    $('#fadeBouquetFlowers').innerHTML = bouquetMarkup('', false);
    const configuredTitle = String(state.config.title || '');
    const coverTitleMarkup = configuredTitle === "Happy Vietnamese Women's Day 20/10"
      ? "Happy Vietnamese<br /><em>Women's Day</em> <strong>20/10</strong>"
      : escapeHtml(configuredTitle).replace(/20\/10/g, '<strong>20/10</strong>').replace(/\r?\n/g, '<br />');
    $('#coverTitle').innerHTML = coverTitleMarkup;
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
      state.bloomTimer = setTimeout(() => { $('#bloomActions').hidden = false; }, 4500);
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
    const source = Array.isArray(state.config.photos) ? state.config.photos : defaults.photos;
    state.photos = source.map((photo, index) => ({
      src: safeUrl(photo.src) || placeholderData(index),
      originalSrc: safeUrl(photo.src),
      caption: photo.caption || `Khoảnh khắc ${index + 1}`,
      note: photo.note || 'Ảnh của chúng mình',
      fit: photo.fit === 'cover' ? 'cover' : 'contain',
      position: ['center', 'top', 'bottom', 'left', 'right'].includes(photo.position) ? photo.position : 'center',
      placeholder: !photo.src
    }));
  }

  function getGalleryBatchSizes(total) {
    const sizes = [];
    let remaining = total;
    let batchIndex = 0;
    while (remaining > 0) {
      const size = Math.min(batchIndex % 2 === 0 ? 2 : 3, remaining);
      sizes.push(size);
      remaining -= size;
      batchIndex += 1;
    }
    return sizes;
  }

  function renderGallery() {
    normalizePhotos();
    const track = $('#galleryTrack');
    track.innerHTML = state.photos.map((photo, index) => {
      const width = Math.round(Math.min(150, window.innerWidth * .32));
      const height = Math.round(width * 1.45);
      const rotate = [-5, 4, -2, 5, -4, 2][index % 6];
      const fit = photo.placeholder ? 'contain' : photo.fit;
      return `<figure class="memory-card ${photo.placeholder ? 'is-placeholder' : ''}" style="--width:${width}px;--height:${height}px;--rotate:${rotate}deg;--photo-fit:${fit};--photo-position:${photo.position};--photo-a:${index % 2 ? '#4c68ad' : '#db7ca5'};--photo-b:${index % 2 ? '#59bee4' : '#f4c3d5'}"><img loading="eager" decoding="async" fetchpriority="high" src="${escapeAttr(photo.src)}" alt="${escapeAttr(photo.caption)}" /></figure>`;
    }).join('');
    track.querySelectorAll('img').forEach((image, index) => {
      const useOriginalAspectRatio = () => {
        if (!image.naturalWidth || !image.naturalHeight) return;
        const card = image.closest('.memory-card');
        const width = Number.parseFloat(card?.style.getPropertyValue('--width'));
        if (card && width) card.style.setProperty('--height', `${Math.round(width * image.naturalHeight / image.naturalWidth)}px`);
      };
      image.addEventListener('load', useOriginalAspectRatio, { once: true });
      if (image.complete) useOriginalAspectRatio();
      image.addEventListener('error', () => {
        image.src = placeholderData(index);
        image.closest('.memory-card')?.classList.add('is-placeholder');
      }, { once: true });
    });
    animateGalleryHeartRise(track);
  }

  function heartFormationPoint(slot, count, width, height, centerX, laneWidth) {
    const layouts = {
      1: [[0, 0]],
      2: [[-.28, -.19], [.28, .19]],
      3: [[-.28, -.12], [.28, -.12], [0, .15]]
    };
    const [x, y] = layouts[count][slot];
    return { x: centerX + x * laneWidth, y: height * (.53 + y) };
  }

  function galleryDrift(card, progress, now, width) {
    const sway = Math.sin(now / 1900 + card.index * 1.7) * Math.min(width * .012, card.laneWidth * .015);
    return {
      x: (card.mode === 'solo' ? Math.sin(progress * Math.PI * 2 + card.index) * Math.min(width * .07, card.laneWidth * .06) : 0) + sway,
      y: Math.cos(now / 2300 + card.index * 1.4) * 4
    };
  }

  function animateGalleryHeartRise(track) {
    cancelAnimationFrame(state.galleryFrame);
    const elements = [...track.querySelectorAll('.memory-card')];
    const cards = elements.map((element, index) => ({ element, index, mode: '', unit: 0, slot: 0, unitSize: 1, baseX: 0, baseY: 0, dragX: 0, dragY: 0, dragging: false, x: 0, y: 0, pointerX: 0, pointerY: 0, startX: 0, startY: 0 }));
    state.galleryCards = cards;
    if (!cards.length) return;

    const units = [];
    let nextCard = 0;
    for (const [unitIndex, batchSize] of getGalleryBatchSizes(cards.length).entries()) {
      const group = cards.slice(nextCard, nextCard + batchSize);
      nextCard += batchSize;
      const heartCards = group.length >= 4 ? group.slice(0, 3) : group.length === 1 ? [] : group;
      const soloCards = group.filter((card) => !heartCards.includes(card));
      heartCards.forEach((card, slot) => { card.mode = 'heart'; card.unit = unitIndex; card.slot = slot; });
      soloCards.forEach((card) => { card.mode = 'solo'; card.unit = unitIndex; });
      units.push({ cards: group, heartCards, soloCards, index: unitIndex });
    }

    const flightDuration = 13000;
    const unitInterval = 2800;
    units.forEach((unit, index) => { unit.startAt = index * unitInterval; unit.duration = flightDuration; });
    const cycleDuration = flightDuration + unitInterval * Math.max(0, units.length - 1);
    let trackWidth = 0;
    let trackHeight = 0;
    let cardHeightSignature = '';
    const refreshLayout = () => {
      trackWidth = track.clientWidth;
      trackHeight = track.clientHeight;
      for (const unit of units) {
        unit.laneWidth = trackWidth;
        unit.centerX = trackWidth * .5;
        unit.verticalOffset = trackHeight * .12 * unit.index;
        unit.heartCards.forEach((card) => {
            card.laneWidth = unit.laneWidth;
            const point = heartFormationPoint(card.slot, unit.heartCards.length, trackWidth, trackHeight, unit.centerX, unit.laneWidth);
            card.baseX = point.x;
            card.baseY = point.y;
        });
        unit.soloCards.forEach((card) => {
          card.laneWidth = unit.laneWidth;
          const side = unit.index % 2 === 0 ? -1 : 1;
          card.baseX = unit.centerX + unit.laneWidth * .34 * side;
          card.baseY = trackHeight * .86;
        });
        const heights = unit.cards.map((card) => card.element.offsetHeight || 140);
        unit.minY = Math.min(...unit.cards.map((card) => card.baseY));
        unit.maxY = Math.max(...unit.cards.map((card) => card.baseY));
        unit.maxCardHeight = Math.max(...heights);
        unit.startOffset = trackHeight + unit.maxCardHeight / 2 - unit.maxY;
        unit.endOffset = -unit.maxCardHeight / 2 - unit.minY;
      }
      cardHeightSignature = cards.map((card) => card.element.offsetHeight || 140).join(',');
    };
    refreshLayout();
    const startedAt = performance.now();

    for (const card of cards) {
      card.element.addEventListener('pointerdown', (event) => {
        event.preventDefault();
        card.dragging = true;
        card.element.classList.add('is-dragging');
        card.element.setPointerCapture(event.pointerId);
        const trackRect = track.getBoundingClientRect();
        const cardRect = card.element.getBoundingClientRect();
        card.x = cardRect.left + cardRect.width / 2 - trackRect.left;
        card.y = cardRect.top + cardRect.height / 2 - trackRect.top;
        card.pointerX = event.clientX;
        card.pointerY = event.clientY;
        card.startX = card.x;
        card.startY = card.y;
      });
      card.element.addEventListener('pointermove', (event) => {
        if (!card.dragging) return;
        card.x = card.startX + event.clientX - card.pointerX;
        card.y = card.startY + event.clientY - card.pointerY;
      });
      const release = (event) => {
        if (!card.dragging) return;
        card.x = card.startX + event.clientX - card.pointerX;
        card.y = card.startY + event.clientY - card.pointerY;
        const now = performance.now();
        const cycleTime = (now - startedAt) % cycleDuration;
        const unit = units[card.unit];
        const progress = Math.max(0, Math.min(1, (cycleTime - unit.startAt) / unit.duration));
        const rise = unit.startOffset + (unit.endOffset - unit.startOffset) * progress;
        const drift = galleryDrift(card, progress, now, trackWidth);
        card.dragX = card.x - card.baseX - drift.x;
        card.dragY = card.y - card.baseY - unit.verticalOffset - rise - drift.y;
        card.dragging = false;
        card.element.classList.remove('is-dragging');
      };
      card.element.addEventListener('pointerup', release);
      card.element.addEventListener('pointercancel', release);
    }

    const draw = (now) => {
      if (!track.isConnected) return;
      const currentHeightSignature = cards.map((card) => card.element.offsetHeight || 140).join(',');
      if (track.clientWidth !== trackWidth || track.clientHeight !== trackHeight || currentHeightSignature !== cardHeightSignature) refreshLayout();
      const cycleTime = (now - startedAt) % cycleDuration;
      for (const card of cards) {
        const unit = units[card.unit];
        const localTime = cycleTime - unit.startAt;
        const active = localTime >= 0 && localTime < unit.duration;
        const progress = Math.max(0, Math.min(1, localTime / unit.duration));
        const rise = unit.startOffset + (unit.endOffset - unit.startOffset) * progress;
        const drift = galleryDrift(card, progress, now, trackWidth);
        if (!card.dragging) {
          card.x = card.baseX + drift.x + card.dragX;
          card.y = card.baseY + rise + unit.verticalOffset + drift.y + card.dragY;
        }
        const fade = Math.max(0, Math.min(1, progress / .08, (1 - progress) / .1));
        const smoothFade = fade * fade * (3 - 2 * fade);
        card.element.style.opacity = card.dragging ? '1' : active ? String(smoothFade) : '0';
        card.element.style.transform = `translate3d(${card.x - card.element.offsetWidth / 2}px, ${card.y - card.element.offsetHeight / 2}px, 0) rotate(${[-5, 4, -2, 5, -4, 2][card.index % 6]}deg)`;
      }
      state.galleryFrame = requestAnimationFrame(draw);
    };
    state.galleryFrame = requestAnimationFrame(draw);
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

  function openSettings() {
    if (state.recipientView) return;
    $('#settingsPanel').classList.remove('is-link-only');
    app.classList.remove('is-link-result');
    $('#settingsPanel').classList.add('is-open');
    $('#settingsPanel').setAttribute('aria-hidden', 'false');
    $('#settingsScrim').hidden = false;
  }
  function closeSettings() {
    $('#settingsPanel').classList.remove('is-open', 'is-link-only');
    app.classList.remove('is-link-result');
    $('#settingsPanel').setAttribute('aria-hidden', 'true');
    $('#settingsScrim').hidden = true;
  }

  function applyRecipientView() {
    state.recipientView = isRecipientViewRequested();
    $('#settingsToggle').hidden = state.recipientView;
    $('.gallery-hint').hidden = state.recipientView;
    document.body.classList.toggle('is-recipient-view', state.recipientView);
    $('#settingsPanel').inert = state.recipientView;
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
      return `<article class="photo-list__item"><button class="photo-list__preview" data-photo-replace-trigger="${index}" type="button" aria-label="Chạm ảnh đại diện ${index + 1} để thay"><img data-photo-preview="${index}" src="${escapeAttr(photo.src || placeholderData(index))}" alt="" style="object-fit:${fit};object-position:${position}" /><span>Chạm để đổi</span></button><div class="photo-list__fields"><label class="photo-edit-field">Chú thích<input type="text" data-photo-caption="${index}" value="${escapeAttr(photo.caption || `Ảnh ${index + 1}`)}" aria-label="Chú thích ảnh ${index + 1}" /></label><label class="photo-edit-field">Ghi chú<input type="text" data-photo-note="${index}" value="${escapeAttr(photo.note || '')}" aria-label="Ghi chú ảnh ${index + 1}" /></label><div class="photo-list__view"><label class="photo-edit-field">Cách hiển thị<select data-photo-fit="${index}" aria-label="Cách hiển thị ảnh ${index + 1}"><option value="contain" ${fit === 'contain' ? 'selected' : ''}>Vừa khung · không cắt</option><option value="cover" ${fit === 'cover' ? 'selected' : ''}>Phủ khung · có thể cắt</option></select></label><label class="photo-edit-field">Canh ảnh<select data-photo-position="${index}" aria-label="Canh ảnh ${index + 1}">${positions.map(([value, label]) => `<option value="${value}" ${position === value ? 'selected' : ''}>${label}</option>`).join('')}</select></label></div></div><div class="photo-list__controls"><button type="button" data-move-photo="up:${index}" aria-label="Đưa ảnh ${index + 1} lên trước" ${index === 0 ? 'disabled' : ''}>↑</button><button type="button" data-move-photo="down:${index}" aria-label="Đưa ảnh ${index + 1} xuống sau" ${index === photos.length - 1 ? 'disabled' : ''}>↓</button><input class="photo-replace-input" type="file" data-replace-photo="${index}" accept="image/*,.heic,.heif" aria-label="Thay ảnh ${index + 1}" hidden /><button type="button" data-remove-photo="${index}" aria-label="Xóa ảnh ${index + 1}">×</button></div></article>`;
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
    list.querySelectorAll('[data-photo-replace-trigger]').forEach((button) => button.addEventListener('click', () => {
      const input = list.querySelector(`[data-replace-photo="${button.dataset.photoReplaceTrigger}"]`);
      input?.click();
    }));
    list.querySelectorAll('[data-replace-photo]').forEach((input) => input.addEventListener('change', () => {
      const file = input.files[0];
      const index = Number(input.dataset.replacePhoto);
      const photo = state.config.photos[index];
      input.value = '';
      if (!file || !photo || (!file.type.startsWith('image/') && !/\.(heic|heif)$/i.test(file.name))) {
        showToast('Chọn một tệp ảnh để thay ảnh này.');
        return;
      }
      markShareDirty();
      state.photoProcessing = state.photoProcessing.then(async () => {
        photo.src = await compressImage(file, 1280);
        if (!state.config.photos.includes(photo)) return;
        renderPhotoList();
        showToast('Đã thay ảnh. Bấm lưu để cập nhật link mới.');
      }).catch((error) => {
        console.error('Không thay được ảnh:', error);
        showToast('Không đọc được ảnh này. Hãy thử tệp ảnh khác.');
      });
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
    const validFiles = files.filter((file) => file.type.startsWith('image/') || /\.(heic|heif)$/i.test(file.name));
    if (validFiles.length !== files.length) showToast('Đã bỏ qua tệp không phải ảnh.');
    if (!validFiles.length) return;
    markShareDirty();
    const uploadStatus = $('#photosUploadStatus');
    uploadStatus.textContent = 'Đang xử lý ảnh mới...';
    state.photoProcessing = state.photoProcessing.then(async () => {
      const added = [];
      for (const [index, file] of validFiles.entries()) {
        uploadStatus.textContent = 'Đang nén ảnh...';
        const src = await compressImage(file, 1280);
        added.push({ src, caption: file.name.replace(/\.[^.]+$/, '') || `Ảnh ${state.config.photos.length + index + 1}`, note: 'Ảnh của chúng mình', fit: 'contain', position: 'center' });
      }
      state.config.photos = [...(state.config.photos || []), ...added];
      renderPhotoList();
      uploadStatus.textContent = 'Đã thêm ảnh mới. Có thể sắp xếp hoặc xóa ảnh trong danh sách.';
      showToast('Đã thêm ảnh mới. Bạn có thể sửa, sắp xếp hoặc xóa trước khi lưu.');
    }).catch((error) => {
      console.error('Không xử lý được ảnh đã chọn:', error);
      uploadStatus.textContent = 'Ảnh chưa tải được. Hãy thử chọn lại ảnh khác.';
      showToast('Không đọc được ảnh này. Hãy chọn tệp ảnh khác.');
    });
  }

  function markShareDirty() {
    state.isDirty = true;
    if (!$('#shareResult').hidden) {
      $('#shareLinkNote').textContent = 'Có thay đổi chưa lưu. Hãy bấm “Lưu và tạo link riêng” trước khi gửi link.';
      $('#copyRecipientLink').disabled = true;
      $('#sendShareLink').disabled = true;
    }
  }

  function createShareLink(makeNewId = false) {
    if (makeNewId || !state.shareId) state.shareId = createShareId();
    state.isDirty = false;
    const baseUrl = `${window.location.origin}${window.location.pathname}`;
    const gift = encodeSharedConfig(state.config);
    const sid = encodeURIComponent(state.shareId);
    state.shareUrl = `${baseUrl}#gift=${gift}&sid=${sid}&view=recipient`;
    $('#shareResult').hidden = false;
    $('#shareLinkOutput').value = state.shareUrl;
    $('#shareLinkNote').textContent = state.shareUrl.length > 1800000
      ? 'Link chứa ảnh/nhạc quá dài; một số điện thoại có thể không sao chép hoặc mở ổn định. Hãy dùng tệp nhỏ hơn rồi lưu lại.'
      : 'Link mới này chứa cấu hình hiện tại. Link đã tạo trước đó vẫn giữ cấu hình cũ; hãy sao chép và gửi link mới bên dưới.';
    $('#copyRecipientLink').disabled = false;
    $('#sendShareLink').disabled = false;
    return state.shareUrl;
  }

  async function copyText(text, fallbackSelector = '#shareLinkOutput') {
    if (!text) return 'failed';
    try {
      if (window.isSecureContext && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return 'copied';
      }
    } catch (error) {
      console.warn('Clipboard API bị chặn; thử cách sao chép tương thích hơn:', error);
    }
    const input = $(fallbackSelector);
    if (!input) return 'failed';
    input.value = text;
    input.focus();
    input.select();
    try { input.setSelectionRange(0, input.value.length); } catch (error) { /* Một số trình duyệt không hỗ trợ. */ }
    try { document.execCommand('copy'); } catch (error) { console.warn('Không xác nhận được sao chép bằng trình duyệt:', error); }
    // Trên một số điện thoại, execCommand trả true dù clipboard không nhận nội dung.
    // Chỉ Clipboard API thành công mới được báo là đã sao chép; fallback chỉ chọn link.
    return 'manual';
  }

  function copyStatusMessage(status, copiedMessage) {
    if (status === 'copied') return copiedMessage;
    return 'Chưa sao chép được tự động. Link đã được chọn; nhấn giữ để sao chép thủ công.';
  }

  async function copyRecipientLink() {
    const text = $('#shareLinkOutput').value;
    const status = await copyText(text, '#shareLinkOutput');
    showToast(copyStatusMessage(status, 'Đã sao chép link gửi người nhận.'));
  }

  function sendPersonalLink() {
    const url = $('#shareLinkOutput').value || createShareLink();
    if (!navigator.share) {
      showToast('Trình duyệt này không hỗ trợ bảng chọn ứng dụng. Hãy mở thiệp bằng Safari hoặc Chrome trên điện thoại.');
      return;
    }
    try {
      // Keep payload minimal: the URL itself already contains the whole gift config.
      const sharing = navigator.share({ title: `Thiệp 20/10 gửi ${state.config.recipient}`, url });
      showToast('Đã mở bảng ứng dụng. Chọn Zalo, Facebook, Messenger hoặc ứng dụng muốn gửi.');
      sharing.catch((error) => { if (error.name !== 'AbortError') { console.warn('Không mở được bảng ứng dụng:', error); showToast('Điện thoại không mở được bảng ứng dụng chia sẻ.'); } });
    } catch (error) {
      console.warn('Không mở được bảng ứng dụng:', error);
      showToast('Điện thoại không mở được bảng ứng dụng chia sẻ.');
    }
  }

  async function handleSettingsSubmit(event) {
    event.preventDefault();
    if (state.recipientView) return;
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
    const locallyPersisted = persistConfig();
    setAudioSource(state.config.music);
    applyBackground(state.config.background);
    prepareBloom();
    renderPhotoList();
    $('#backgroundInput').value = '';
    $('#musicInput').value = '';
    $('#photosInput').value = '';
    updateMediaStatus();
    createShareLink(true);
    $('#settingsPanel').classList.add('is-link-only');
    app.classList.add('is-link-result');
    showToast(locallyPersisted ? 'Đã lưu nội dung và tạo link mới.' : 'Đã tạo link mới; bộ nhớ cục bộ đầy nên hãy sao chép link gốc để giữ bản chỉnh sửa.');
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
    if (url.length > 1800000) showToast('Link rất dài do có ảnh/nhạc nhúng; nên dùng tệp nhỏ hơn.');
    const shareData = { title: `Thiệp 20/10 gửi ${state.config.recipient}`, url };
    if (navigator.share) {
      try { await navigator.share(shareData); showToast('Đã mở bảng chia sẻ.'); return; }
      catch (error) { if (error.name === 'AbortError') return; console.warn('Không mở được bảng chia sẻ:', error); }
    }
    showToast('Trình duyệt này không hỗ trợ bảng chọn ứng dụng. Hãy mở thiệp bằng Safari hoặc Chrome trên điện thoại.');
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
    $('#openGift').addEventListener('click', () => {
      const audio = $('#bgMusic');
      if (audio.src) audio.play().catch(() => showToast('Chạm nút nhạc ♫ để phát nếu điện thoại vẫn chặn tự động.'));
      beginBloom();
    });
    $('#readLetter').addEventListener('click', openLetter);
    $('#closeLetter').addEventListener('click', () => setScreen('bloom'));
    $('#continueToAlbum').addEventListener('click', startFade);
    $('#musicToggle').addEventListener('click', toggleMusic);
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
    $('#restartButton').addEventListener('click', () => { clearTimeout(state.bloomTimer); clearTimeout(state.fadeTimer); setScreen('cover'); });
    $('#shareButton').addEventListener('click', shareCard);
    $('#copyRecipientLink').addEventListener('click', copyRecipientLink);
    $('#sendShareLink').addEventListener('click', sendPersonalLink);
    $('#choosePhotosButton').addEventListener('click', () => $('#photosInput').click());
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
