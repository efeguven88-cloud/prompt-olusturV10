/* ============================================================
   AI Studio — multi-provider engine, chat history, prompt library
   Loaded after app.js. Uses window.PL for shared app helpers.
   ============================================================ */
(() => {
  'use strict';

  const PL = window.PL;
  if (!PL) return;

  const $ = (id) => document.getElementById(id);
  const { el, toast, copy, openExt, saveFile } = PL;

  const AI_KEY = 'promptlab.ai.v2';
  const CHAT_KEY = 'promptlab.chats.v1';
  const LIB_KEY = 'promptlab.prompts.v1';

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));

  const uid = (p) => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
  const todayKey = () => new Date().toLocaleDateString('en-CA');

  /* ---------- Provider registry ---------- */

  const PROVIDERS = [
    {
      id: 'openai', name: 'OpenAI', short: 'OA', color: '#10a37f', kind: 'openai',
      base: 'https://api.openai.com/v1', docs: 'https://platform.openai.com/api-keys',
      hint: 'sk-…', suggested: ['gpt-4o-mini', 'gpt-4o', 'gpt-4.1-mini', 'o4-mini']
    },
    {
      id: 'anthropic', name: 'Anthropic', short: 'AN', color: '#d97757', kind: 'anthropic',
      base: 'https://api.anthropic.com/v1', docs: 'https://console.anthropic.com/settings/keys',
      hint: 'sk-ant-…', suggested: ['claude-sonnet-4-5', 'claude-haiku-4-5', 'claude-opus-4-1']
    },
    {
      id: 'google', name: 'Google Gemini', short: 'GE', color: '#4285f4', kind: 'google',
      base: 'https://generativelanguage.googleapis.com/v1beta', docs: 'https://aistudio.google.com/app/apikey',
      hint: 'AIza…', suggested: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash']
    },
    {
      id: 'groq', name: 'Groq', short: 'GQ', color: '#f55036', kind: 'openai',
      base: 'https://api.groq.com/openai/v1', docs: 'https://console.groq.com/keys',
      hint: 'gsk_…', suggested: ['llama-3.3-70b-versatile', 'openai/gpt-oss-120b', 'llama-3.1-8b-instant'],
      filter: (id) => !/^whisper|tts|guard|embed/i.test(id)
    },
    {
      id: 'openrouter', name: 'OpenRouter', short: 'OR', color: '#7c3aed', kind: 'openai',
      base: 'https://openrouter.ai/api/v1', docs: 'https://openrouter.ai/keys',
      hint: 'sk-or-…', suggested: ['openai/gpt-4o-mini', 'anthropic/claude-3.5-sonnet', 'google/gemini-2.0-flash-001', 'meta-llama/llama-3.3-70b-instruct']
    },
    {
      id: 'xai', name: 'xAI (Grok)', short: 'xA', color: '#334155', kind: 'openai',
      base: 'https://api.x.ai/v1', docs: 'https://console.x.ai',
      hint: 'xai-…', suggested: ['grok-3-mini', 'grok-3', 'grok-2-1212']
    },
    {
      id: 'custom', name: 'Özel sağlayıcı', short: 'API', color: '#0ea5e9', kind: 'openai',
      base: '', docs: '', hint: 'OpenAI uyumlu',
      suggested: ['gpt-4o-mini', 'llama-3.1-8b-instruct', 'qwen2.5-7b-instruct']
    }
  ];
  const BY = Object.fromEntries(PROVIDERS.map((p) => [p.id, p]));

  const CATS = ['Başlık', 'Thumbnail', 'Açıklama', 'Fikir', 'Senaryo', 'SEO', 'Topluluk'];

  /* ---------- State ---------- */

  function defaults() {
    return {
      version: 2,
      active: { provider: 'groq', model: 'llama-3.3-70b-versatile' },
      defaults: { provider: 'groq', model: 'llama-3.3-70b-versatile' },
      keys: {},
      usage: { day: '', providers: {} },
      limit: 50,
      temp: 0.8,
      replyLang: 'tr',
      system: '',
      storeKeys: true,
      seeded: false,
      migrated: false
    };
  }

  let A = defaults();
  let chats = [];
  let lib = [];
  let activeChatId = null;
  let tab = 'chat';
  let busy = false;
  let activeAbort = null;
  let keyProvider = null;
  let editingPromptId = null;
  let confirmAction = null;
  let promptCat = '';
  let searchTimer = 0;
  let systemTimer = 0;

  const stateOf = (pid) => {
    if (!A.keys[pid]) A.keys[pid] = { key: '', models: [], base: '', test: null, updated: 0 };
    const st = A.keys[pid];
    if (!Array.isArray(st.models)) st.models = [];
    return st;
  };

  function loadState() {
    let raw = {};
    try { raw = JSON.parse(localStorage.getItem(AI_KEY) || '{}') || {}; } catch (e) { raw = {}; }
    const d = defaults();
    A = {
      ...d,
      ...raw,
      active: { ...d.active, ...(raw.active || {}) },
      defaults: { ...d.defaults, ...(raw.defaults || {}) },
      usage: { day: '', providers: {}, ...(raw.usage || {}) },
      keys: { ...(raw.keys || {}) }
    };
    Object.keys(A.keys).forEach((id) => { if (!BY[id]) delete A.keys[id]; });
    A.limit = clamp(parseInt(A.limit, 10) || 0, 0, 1000);
    A.temp = clamp(Number(A.temp), 0, 1.5);
    if (!['tr', 'en', 'auto'].includes(A.replyLang)) A.replyLang = 'tr';
    A.storeKeys = A.storeKeys !== false;
    migrateLegacy();
    ensureActive();
  }

  function serialize() {
    const out = { ...A, keys: {} };
    Object.keys(A.keys).forEach((id) => {
      out.keys[id] = { ...A.keys[id] };
      if (!A.storeKeys) out.keys[id].key = '';
    });
    return out;
  }

  function saveState() {
    try { localStorage.setItem(AI_KEY, JSON.stringify(serialize())); }
    catch (e) { toast('AI ayarları kaydedilemedi: cihaz depolaması dolu olabilir.'); }
  }

  function migrateLegacy() {
    if (A.migrated) return;
    try {
      const old = JSON.parse(localStorage.getItem('promptlab.grok.v1') || 'null');
      if (old && typeof old.key === 'string' && old.key) {
        const pid = /^xai-/i.test(old.key) ? 'xai' : /^gsk_/i.test(old.key) ? 'groq' : null;
        if (pid) {
          const st = stateOf(pid);
          if (!st.key) {
            st.key = old.key;
            st.models = Array.isArray(old.models) ? old.models : [];
            st.updated = Date.now();
            if (old.model) {
              A.defaults.provider = pid;
              A.defaults.model = old.model;
              A.active.provider = pid;
              A.active.model = old.model;
            }
            if (Number.isFinite(Number(old.limit))) A.limit = clamp(parseInt(old.limit, 10) || 0, 0, 1000);
          }
        }
        localStorage.removeItem('promptlab.grok.v1');
      }
    } catch (e) { /* ignore malformed legacy data */ }
    A.migrated = true;
    saveState();
  }

  function loadChats() {
    try {
      const d = JSON.parse(localStorage.getItem(CHAT_KEY) || '[]');
      chats = Array.isArray(d) ? d : [];
    } catch (e) { chats = []; }
    chats = chats.filter((c) => c && c.id && Array.isArray(c.messages)).map((c) => ({
      ...c,
      title: String(c.title || 'Sohbet'),
      messages: c.messages.filter((m) => m && ['user', 'assistant', 'error'].includes(m.role) && typeof m.content === 'string')
    }));
  }

  function saveChats() {
    if (chats.length > 160) {
      chats = [...chats].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || (b.updated || 0) - (a.updated || 0)).slice(0, 160);
      if (activeChatId && !chats.some((c) => c.id === activeChatId)) activeChatId = null;
    }
    chats.forEach((c) => { if (c.messages.length > 240) c.messages = c.messages.slice(-240); });
    try { localStorage.setItem(CHAT_KEY, JSON.stringify(chats)); }
    catch (e) { toast('Sohbet geçmişi kaydedilemedi: cihaz depolaması dolu.'); }
  }

  function loadLib() {
    try {
      const d = JSON.parse(localStorage.getItem(LIB_KEY) || '[]');
      lib = Array.isArray(d) ? d.filter((p) => p && p.id && p.title && p.text) : [];
    } catch (e) { lib = []; }
    lib = lib.map((p) => ({ ...p, tags: Array.isArray(p.tags) ? p.tags : [] }));
    if (!A.seeded) {
      if (!lib.length) lib = seedPrompts();
      A.seeded = true;
      saveState();
      saveLib();
    }
  }

  function saveLib() {
    try { localStorage.setItem(LIB_KEY, JSON.stringify(lib)); }
    catch (e) { toast('Prompt kütüphanesi kaydedilemedi: cihaz depolaması dolu.'); }
  }

  function seedPrompts() {
    const now = Date.now();
    return [
      {
        id: uid('pr'), title: 'Tıklanabilir başlık üret', category: 'Başlık', tags: ['youtube', 'başlık'], uses: 0, created: now, updated: now,
        text: 'YouTube oyun videom için 10 farklı, merak uyandıran ve yanıltıcı olmayan Türkçe başlık öner.\n\nOyun: [oyun adı]\nVideonun konusu: [konu]\nThumbnail metni: [metin]\n\nBaşlıklar doğal ve mobilde kolay okunur olsun. En iyi 3 öneriyi birer cümleyle neden seçtiğini açıkla.'
      },
      {
        id: uid('pr'), title: 'Thumbnail konsepti', category: 'Thumbnail', tags: ['görsel', 'thumbnail'], uses: 0, created: now, updated: now,
        text: '16:9 YouTube oyun thumbnail’i için ayrıntılı bir görsel üretim promptu yaz.\n\nOyun: [oyun]\nVideo konusu: [konu]\nRenk paleti: [renkler]\nYüz ifadesi: [ifade]\nGörselde yazacak metin: [metin]\n\nKompozisyonu, ışığı, kamera açısını ve metnin okunabilirliğini tarif et. Oyun dünyasına uygun sahneler kullan; alakasız nesneler ekleme.'
      },
      {
        id: uid('pr'), title: 'Açıklama ve bölümler', category: 'Açıklama', tags: ['youtube', 'açıklama'], uses: 0, created: now, updated: now,
        text: 'Bu video için doğal ve düzenli bir YouTube açıklaması yaz.\n\nOyun: [oyun]\nVideo konusu: [konu]\nÖne çıkan anlar: [anlar]\nKanal bağlantıları: [bağlantılar]\n\nİlk iki cümlede videoyu tanıt, kısa paragraflar kullan, bölümler ve 5 ilgili hashtag ekle. Verilmeyen bağlantı veya bilgi uydurma.'
      },
      {
        id: uid('pr'), title: '8 video fikri', category: 'Fikir', tags: ['fikir', 'strateji'], uses: 0, created: now, updated: now,
        text: 'Oyun kanalım için 8 farklı video fikri üret. Her fikir için oyun adı, 1-2 cümlelik konu, merak uyandıran bir başlık ve 2-3 etiket yaz.\n\nKanalın oyunları: [oyunlar]\nSık kullanılan etiketler: [etiketler]\nEk istek: [istek]\n\nYalnızca geçerli bir JSON dizisi döndür: [{"game":"...","topic":"...","title":"...","tags":"..."}]'
      },
      {
        id: uid('pr'), title: 'Shorts senaryosu', category: 'Senaryo', tags: ['shorts', 'senaryo'], uses: 0, created: now, updated: now,
        text: '45 saniyelik dikey YouTube Shorts senaryosu yaz.\n\nOyun: [oyun]\nKonu: [konu]\n\n0-3 saniye kanca, 3-35 saniye gelişme, son 10 saniye kapanış ve izleyiciye çağrı olacak şekilde sahne sahne yaz. Ekranda görünecek kısa metinleri ve seslendirme metnini ayrı belirt.'
      },
      {
        id: uid('pr'), title: 'SEO etiketleri', category: 'SEO', tags: ['seo', 'etiket'], uses: 0, created: now, updated: now,
        text: 'Bu video için 15 ilgili YouTube anahtar kelimesi ve etiket öner.\n\nOyun: [oyun]\nKonu: [konu]\nHedef kitle: [kitle]\n\nTekrar spam’i yapma; kısa ve uzun kuyruk aramaları karıştır. En önemli 5 etiketi nedenleriyle işaretle.'
      }
    ];
  }

  /* ---------- Selection helpers ---------- */

  function connectedProviders() {
    return PROVIDERS.filter((p) => stateOf(p.id).key && (p.id !== 'custom' || !!stateOf(p.id).base));
  }

  function ensureActive() {
    if (!BY[A.active.provider]) A.active.provider = (connectedProviders()[0] || BY.groq).id;
    const st = stateOf(A.active.provider);
    if (!A.active.model) {
      const p = BY[A.active.provider];
      A.active.model = st.models[0] || p.suggested[0] || '';
    }
    return BY[A.active.provider];
  }

  function activeChat() { return chats.find((c) => c.id === activeChatId) || null; }
  function uiProvider() { const c = activeChat(); return BY[(c && c.provider) || A.active.provider] || PROVIDERS[0]; }
  function uiModel() { const c = activeChat(); return (c && c.model) || A.active.model || ''; }
  function providerBase(p) {
    const raw = p.id === 'custom' ? (stateOf('custom').base || '') : p.base;
    return String(raw).replace(/\/+$/, '');
  }
  function firstModel(pid) {
    const p = BY[pid]; if (!p) return '';
    const st = stateOf(pid);
    return st.models[0] || p.suggested[0] || A.active.model || '';
  }

  function rollUsage() {
    const d = todayKey();
    if (!A.usage || A.usage.day !== d) {
      A.usage = { day: d, providers: {} };
      saveState();
    }
    if (!A.usage.providers) A.usage.providers = {};
    return A.usage;
  }

  function totalUsage() {
    const u = rollUsage().providers;
    let requests = 0, tokens = 0;
    Object.values(u).forEach((x) => { requests += x.requests || 0; tokens += x.tokens || 0; });
    return { requests, tokens };
  }

  function bumpUsage(pid, tokens) {
    const u = rollUsage().providers;
    const row = u[pid] || (u[pid] = { requests: 0, tokens: 0 });
    row.requests += 1;
    row.tokens += Math.max(0, Number(tokens) || 0);
    saveState();
  }

  function limitLeft() {
    rollUsage();
    const used = totalUsage().requests;
    return A.limit ? Math.max(0, A.limit - used) : Infinity;
  }

  /* ---------- HTTP + providers ---------- */

  async function http(method, url, headers, body, timeout) {
    const ms = timeout || 120000;
    const C = window.Capacitor;
    const native = C && typeof C.isNativePlatform === 'function' && C.isNativePlatform() &&
      C.Plugins && C.Plugins.CapacitorHttp;
    if (native) {
      try {
        const r = await C.Plugins.CapacitorHttp.request({
          url, method, headers,
          data: body === undefined ? undefined : body,
          responseType: 'json', connectTimeout: 20000, readTimeout: ms
        });
        let d = r.data;
        if (typeof d === 'string') { try { d = JSON.parse(d); } catch (e) { /* keep */ } }
        return { status: Number(r.status) || 0, data: d };
      } catch (e) {
        throw new Error('Bağlanılamadı. İnternet bağlantını kontrol edip tekrar dene.');
      }
    }
    const ac = new AbortController();
    activeAbort = ac;
    const timer = setTimeout(() => { try { ac.abort(); } catch (e) { /* noop */ } }, ms);
    try {
      const r = await fetch(url, {
        method, headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: ac.signal
      });
      let d = null;
      try { d = await r.json(); } catch (e) { /* non-json */ }
      return { status: r.status, data: d };
    } catch (e) {
      if (e && e.name === 'AbortError') throw new Error('İstek durduruldu.');
      throw new Error('Bağlanılamadı. Tarayıcıda CORS engeli olabilir; Android uygulamasında doğrudan çalışır.');
    } finally {
      clearTimeout(timer);
      if (activeAbort === ac) activeAbort = null;
    }
  }

  function apiError(res, p) {
    const d = res.data || {};
    let detail = '';
    if (typeof d.error === 'string') detail = d.error;
    else if (d.error && typeof d.error.message === 'string') detail = d.error.message;
    else if (typeof d.message === 'string') detail = d.message;
    else if (Array.isArray(d) && d[0] && d[0].error && d[0].error.message) detail = d[0].error.message;
    detail = String(detail).replace(/\s+/g, ' ').slice(0, 190);
    const map = {
      400: p.name + ': istek reddedildi (400). Model kimliğini ve ayarları kontrol et.',
      401: p.name + ': API anahtarı reddedildi (401). Anahtarı yeniden ekle.',
      402: p.name + ': kredi veya bakiye yetersiz (402). Sağlayıcı hesabını kontrol et.',
      403: p.name + ': bu istek için yetki yok (403). Anahtarı ve faturalandırmayı kontrol et.',
      404: p.name + ': model bulunamadı (404). Model kimliğini kontrol et veya modelleri yenile.',
      429: p.name + ': hız veya kota sınırı (429). Biraz bekleyip tekrar dene.',
      500: p.name + ': sağlayıcı sunucu hatası (500). Tekrar dene.',
      502: p.name + ': sağlayıcıya ulaşılamadı (502). Tekrar dene.',
      503: p.name + ': sağlayıcı geçici olarak kullanılamıyor (503). Tekrar dene.'
    };
    const err = new Error((map[res.status] || p.name + ': hata ' + res.status + '.') + (detail ? ' · ' + detail : ''));
    err.status = res.status;
    return err;
  }

  async function listModels(p) {
    const st = stateOf(p.id);
    if (!st.key) throw new Error(p.name + ': önce API anahtarı ekle.');
    const base = providerBase(p);
    if (!base) throw new Error('Özel sağlayıcı için sunucu adresi gerekli.');

    let res, ids = [];
    if (p.kind === 'openai') {
      res = await http('GET', base + '/models', {
        Authorization: 'Bearer ' + st.key, Accept: 'application/json'
      });
      if (!res.status || res.status < 200 || res.status >= 300) throw apiError(res, p);
      ids = ((res.data && res.data.data) || []).map((m) => m && (m.id || m.name)).filter(Boolean);
    } else if (p.kind === 'anthropic') {
      res = await http('GET', base + '/models?limit=100', {
        'x-api-key': st.key,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
        Accept: 'application/json'
      });
      if (!res.status || res.status < 200 || res.status >= 300) throw apiError(res, p);
      ids = ((res.data && res.data.data) || []).map((m) => m && m.id).filter(Boolean);
    } else {
      res = await http('GET', base + '/models?pageSize=200', {
        'x-goog-api-key': st.key, Accept: 'application/json'
      });
      if (!res.status || res.status < 200 || res.status >= 300) throw apiError(res, p);
      ids = ((res.data && res.data.models) || [])
        .filter((m) => (m.supportedGenerationMethods || []).includes('generateContent'))
        .map((m) => String(m.name || '').replace(/^models\//, ''))
        .filter(Boolean);
    }

    const bad = /embed|embedding|whisper|tts|transcribe|audio|speech|dall-e|image|imagine|moderation|rerank|guard|orpheus|playai|realtime/i;
    ids = [...new Set(ids)]
      .filter((id) => typeof id === 'string' && id && !bad.test(id) && (!p.filter || p.filter(id)))
      .sort((a, b) => a.localeCompare(b));
    if (!ids.length) throw new Error(p.name + ': model listesi boş döndü. Anahtarı ve sağlayıcı hesabını kontrol et.');

    st.models = ids.slice(0, 400);
    st.updated = Date.now();
    saveState();
    return st.models;
  }

  async function testProvider(pid, quiet) {
    const p = BY[pid];
    const st = stateOf(pid);
    if (!st.key) { if (!quiet) toast(p.name + ': önce API anahtarı ekle.'); return false; }
    const started = Date.now();
    try {
      const ids = await listModels(p);
      st.test = { ok: true, at: Date.now(), ms: Date.now() - started, count: ids.length };
      saveState();
      renderProviders(); renderUsage(); renderHeroStats(); renderStatusChip(); renderSettingsAI();
      if (!quiet) toast(p.name + ' bağlandı · ' + ids.length + ' model · ' + (Date.now() - started) + ' ms');
      return true;
    } catch (e) {
      st.test = { ok: false, at: Date.now(), msg: e.message };
      saveState();
      renderProviders(); renderStatusChip();
      if (!quiet) toast(e.message);
      return false;
    }
  }

  function systemPrompt() {
    const lang = A.replyLang === 'en' ? 'Always answer in English.'
      : A.replyLang === 'auto' ? 'Answer in the same language as the user.'
      : 'Her zaman Türkçe yanıt ver.';
    let s = 'Sen Prompt Olustur uygulamasının AI içerik asistanısın. YouTube oyun içerikleri, başlık, açıklama, thumbnail, Shorts ve yayın stratejisi konusunda deneyimlisin. Kısa, net ve uygulanabilir yanıtlar ver; gereksiz uzatma. ' + lang;
    if (A.system && A.system.trim()) s += '\n\nKullanıcının ek talimatları: ' + A.system.trim();
    return s;
  }

  async function ask(pid, model, messages, systemOverride) {
    const p = BY[pid] || ensureActive();
    const st = stateOf(p.id);
    if (!st.key) throw new Error(p.name + ': önce API anahtarı ekle.');
    if (p.id === 'custom' && !providerBase(p)) throw new Error('Özel sağlayıcı için sunucu adresi gerekli.');
    rollUsage();
    if (A.limit && totalUsage().requests >= A.limit) throw new Error('Günlük soru sınırına ulaştın (' + A.limit + '). Ayarlardan artırabilirsin.');
    if (!model) throw new Error('Bir model seç.');

    const base = providerBase(p);
    const sys = systemOverride || systemPrompt();
    const safeMessages = (messages || []).filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string');
    let url, headers, body;

    if (p.kind === 'openai') {
      url = base + '/chat/completions';
      headers = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + st.key };
      if (p.id === 'openrouter') {
        headers['HTTP-Referer'] = 'https://prompt-olustur.app';
        headers['X-Title'] = 'Prompt Olustur';
      }
      body = {
        model,
        temperature: A.temp,
        messages: [{ role: 'system', content: sys }, ...safeMessages.map((m) => ({ role: m.role, content: m.content }))]
      };
    } else if (p.kind === 'anthropic') {
      url = base + '/messages';
      headers = {
        'Content-Type': 'application/json',
        'x-api-key': st.key,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      };
      body = {
        model, max_tokens: 4096, temperature: A.temp, system: sys,
        messages: safeMessages.map((m) => ({ role: m.role, content: m.content }))
      };
    } else {
      url = base + '/models/' + encodeURIComponent(model) + ':generateContent';
      headers = { 'Content-Type': 'application/json', 'x-goog-api-key': st.key };
      body = {
        systemInstruction: { parts: [{ text: sys }] },
        contents: safeMessages.map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
        generationConfig: { temperature: A.temp, maxOutputTokens: 4096 }
      };
    }

    const res = await http('POST', url, headers, body, 180000);
    if (!res.status || res.status < 200 || res.status >= 300) throw apiError(res, p);
    const d = res.data || {};
    if (d.error && !d.choices && !d.content && !d.candidates) throw apiError({ status: 400, data: d }, p);

    let text = '', tokens = 0;
    if (p.kind === 'openai') {
      const c = d.choices && d.choices[0];
      const content = c && c.message ? c.message.content : '';
      text = Array.isArray(content) ? content.map((x) => x && x.text || '').join('') : (content || '');
      if (!text && c && c.message && c.message.refusal) throw new Error(p.name + ': model isteği güvenlik nedeniyle reddetti.');
      const u = d.usage || {};
      tokens = u.total_tokens || ((u.prompt_tokens || 0) + (u.completion_tokens || 0));
    } else if (p.kind === 'anthropic') {
      text = (d.content || []).filter((c) => c && c.type === 'text').map((c) => c.text || '').join('\n');
      const u = d.usage || {};
      tokens = (u.input_tokens || 0) + (u.output_tokens || 0);
    } else {
      const c = d.candidates && d.candidates[0];
      text = ((c && c.content && c.content.parts) || []).filter((x) => x && !x.thought).map((x) => x.text || '').join('');
      const u = d.usageMetadata || {};
      tokens = u.totalTokenCount || 0;
      if (!text && c && c.finishReason === 'SAFETY') throw new Error('Yanıt güvenlik filtresiyle engellendi. Soruyu farklı ifade etmeyi dene.');
      if (!text && d.promptFeedback && d.promptFeedback.blockReason) throw new Error('İstek güvenlik filtresiyle engellendi. Soruyu farklı ifade etmeyi dene.');
    }

    text = String(text).replace(/<think[\s\S]*?<\/think>/gi, '').trim();
    if (!text) throw new Error('Boş yanıt geldi. Modeli değiştirip tekrar dene.');
    return { text, tokens };
  }

  /* ---------- Markdown renderer (escaped, safe) ---------- */

  function inline(s) {
    let t = esc(s);
    t = t.replace(/`([^`\n]+)`/g, '<code>$1</code>');
    t = t.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
    t = t.replace(/(^|[\s(])\*([^*\n]+)\*(?=[\s.,!?)]|$)/g, '$1<em>$2</em>');
    t = t.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    t = t.replace(/(^|[\s(])(https?:\/\/[^\s<)]+)/g, '$1<a href="$2" target="_blank" rel="noopener noreferrer">$2</a>');
    return t;
  }

  function markdown(src) {
    const lines = String(src || '').replace(/\r/g, '').split('\n');
    let html = '', list = null, code = null;
    const closeList = () => { if (list) { html += '</' + list + '>'; list = null; } };
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (/^```/.test(line.trim())) {
        if (code) { html += '<pre><code>' + esc(code.join('\n')) + '</code></pre>'; code = null; }
        else { closeList(); code = []; }
        continue;
      }
      if (code) { code.push(line); continue; }
      if (!line.trim()) { closeList(); continue; }
      let m;
      if ((m = /^(#{1,4})\s+(.*)$/.exec(line))) {
        closeList();
        const level = Math.min(4, m[1].length + 1);
        html += '<h' + level + '>' + inline(m[2]) + '</h' + level + '>';
        continue;
      }
      if ((m = /^\s*[-*•]\s+(.*)$/.exec(line))) {
        if (list !== 'ul') { closeList(); html += '<ul>'; list = 'ul'; }
        html += '<li>' + inline(m[1]) + '</li>';
        continue;
      }
      if ((m = /^\s*\d+[.)]\s+(.*)$/.exec(line))) {
        if (list !== 'ol') { closeList(); html += '<ol>'; list = 'ol'; }
        html += '<li>' + inline(m[1]) + '</li>';
        continue;
      }
      if ((m = /^\s*>\s?(.*)$/.exec(line))) { closeList(); html += '<blockquote>' + inline(m[1]) + '</blockquote>'; continue; }
      if (/^\s*(---+|___+)\s*$/.test(line)) { closeList(); html += '<hr>'; continue; }
      closeList();
      html += '<p>' + inline(line) + '</p>';
    }
    if (code) html += '<pre><code>' + esc(code.join('\n')) + '</code></pre>';
    closeList();
    return html;
  }

  /* ---------- Chat UI ---------- */

  function relativeTime(ts) {
    const d = new Date(ts || Date.now()), now = new Date();
    if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
  }

  function titleFrom(text) {
    const t = String(text).replace(/\s+/g, ' ').trim();
    return (t.slice(0, 48) || 'Yeni sohbet') + (t.length > 48 ? '…' : '');
  }

  function sortedChats() {
    return [...chats].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || (b.updated || 0) - (a.updated || 0));
  }

  function renderChatList() {
    const box = $('aiChatList');
    if (!box) return;
    const q = ($('aiChatSearch').value || '').toLocaleLowerCase('tr').trim();
    const list = sortedChats().filter((c) => {
      if (!q) return true;
      return c.title.toLocaleLowerCase('tr').includes(q) ||
        c.messages.some((m) => m.content.toLocaleLowerCase('tr').includes(q));
    });
    box.innerHTML = '';
    if (!list.length) {
      box.append(el('p', 'ai-empty-side', chats.length ? 'Aramayla eşleşen sohbet yok.' : 'Henüz sohbet yok. Yeni bir sohbet başlat.'));
      return;
    }
    list.forEach((c) => {
      const b = el('button', 'ai-conv' + (c.id === activeChatId ? ' on' : ''));
      b.type = 'button';
      b.dataset.chat = c.id;
      b.title = c.title;
      const top = el('div', 'ai-conv-top');
      top.append(el('strong', null, c.title));
      if (c.pinned) top.append(el('span', 'pin', '★'));
      const sub = (c.messages.filter((m) => m.role !== 'error').length) + ' mesaj · ' + relativeTime(c.updated);
      b.append(top, el('small', null, sub));
      b.onclick = () => openChat(c.id);
      box.append(b);
    });
  }

  function emptyState() {
    const w = el('div', 'ai-empty');
    w.append(el('div', 'ai-empty-icon', '✦'));
    w.append(el('h3', null, 'Nasıl yardımcı olabilirim?'));
    w.append(el('p', null, 'Bir soru yaz ya da hazır promptlardan başla. Sohbetlerin bu cihazda otomatik olarak kaydedilir.'));
    const chips = el('div', 'ai-chips');
    [
      'Bu hafta için 3 video fikri üret.',
      'Oyun videom için tıklanabilir başlıklar yaz.',
      'Thumbnail konsepti öner.'
    ].forEach((t) => {
      const b = el('button', 'ai-chip', t);
      b.type = 'button';
      b.onclick = () => { insertPrompt(t); };
      chips.append(b);
    });
    w.append(chips);
    if (!stateOf(uiProvider().id).key) {
      const note = el('div', 'ai-key-warn');
      note.style.maxWidth = '520px';
      note.style.marginTop = '16px';
      note.style.textAlign = 'left';
      note.innerHTML = '<span>🔑</span><span><strong>Başlamak için bir API anahtarı ekle.</strong> Anahtarın yalnızca bu cihazda saklanır; arayüzde gösterilmez.</span>';
      const action = el('button', 'btn primary small', 'Sağlayıcı ekle');
      action.type = 'button';
      action.style.marginTop = '8px';
      action.onclick = () => { switchTab('providers'); openKeyDialog(uiProvider().id); };
      note.lastElementChild.append(action);
      w.append(note);
    }
    return w;
  }

  function typingMessage() {
    const wrap = el('div', 'msg assistant');
    wrap.append(el('div', 'msg-avatar', uiProvider().short || 'AI'));
    const main = el('div', 'msg-main');
    const bubble = el('div', 'msg-bubble');
    bubble.innerHTML = '<span class="typing" aria-label="Yanıt hazırlanıyor"><i></i><i></i><i></i></span>';
    main.append(bubble, el('div', 'msg-meta', 'Yanıt hazırlanıyor…'));
    wrap.append(main);
    return wrap;
  }

  function messageEl(m, chat) {
    const isUser = m.role === 'user';
    const isError = m.role === 'error';
    const wrap = el('div', 'msg ' + (isUser ? 'user' : isError ? 'error' : 'assistant'));
    const p = BY[m.provider || chat.provider] || BY[chat.provider];
    wrap.append(el('div', 'msg-avatar', isUser ? 'SEN' : isError ? '!' : (p ? p.short : 'AI')));

    const main = el('div', 'msg-main');
    const bubble = el('div', 'msg-bubble');
    if (isUser) {
      bubble.textContent = m.content;
      bubble.style.whiteSpace = 'pre-wrap';
    } else if (isError) {
      bubble.textContent = m.content;
      bubble.style.whiteSpace = 'pre-wrap';
      const row = el('div', 'ai-error-actions');
      const retry = el('button', 'btn secondary small', 'Tekrar dene');
      retry.type = 'button'; retry.onclick = () => regenerate();
      const go = el('button', 'btn ghost small', 'Sağlayıcılar');
      go.type = 'button'; go.onclick = () => switchTab('providers');
      row.append(retry, go);
      bubble.append(row);
    } else {
      const md = el('div', 'ai-markdown no-deco');
      md.innerHTML = markdown(m.content);
      bubble.append(md);
    }
    main.append(bubble);

    const meta = el('div', 'msg-meta');
    meta.append(el('span', null, relativeTime(m.ts)));
    if (!isUser && !isError) {
      const tag = (p ? p.short : 'AI') + (m.model ? ' · ' + String(m.model).slice(0, 30) : '');
      meta.append(el('span', 'pill', tag));
      const cp = el('button', 'msg-copy', 'Kopyala');
      cp.type = 'button';
      cp.onclick = () => copy(m.content);
      meta.append(cp);
    }
    main.append(meta);
    wrap.append(main);
    return wrap;
  }

  function renderMessages() {
    const box = $('aiMessages');
    if (!box) return;
    box.innerHTML = '';
    const c = activeChat();
    if (!c || !c.messages.length) {
      box.append(emptyState());
      if (busy) box.append(typingMessage());
      return;
    }
    c.messages.forEach((m) => box.append(messageEl(m, c)));
    if (busy) box.append(typingMessage());
    requestAnimationFrame(() => { box.scrollTop = box.scrollHeight; });
  }

  function renderChatHeader() {
    ensureActive();
    const c = activeChat();
    const p = uiProvider();
    const model = uiModel();
    $('aiChatTitle').textContent = c ? c.title : 'Yeni sohbet';
    const msgCount = c ? c.messages.filter((m) => m.role !== 'error').length : 0;
    $('aiChatMeta').textContent = c
      ? p.name + ' · ' + (model || 'model seç') + ' · ' + msgCount + ' mesaj'
      : p.name + ' · ' + (model || 'model seç');
    renderHeaderSelects();
    const st = stateOf(p.id);
    $('aiKeyHint').textContent = st.key
      ? p.name + ' · ' + (model || 'model seç') + ' · anahtar kayıtlı'
      : p.name + ' · anahtar yok';
    renderComposerHint();
    updateBusyUI();
  }

  function renderHeaderSelects() {
    const ps = $('aiProvSel'), ms = $('aiModelSel');
    if (!ps || !ms) return;
    const p = uiProvider();
    ps.innerHTML = '';
    PROVIDERS.forEach((x) => {
      const o = document.createElement('option');
      o.value = x.id;
      o.textContent = x.name + (stateOf(x.id).key ? ' ✓' : '');
      ps.append(o);
    });
    ps.value = p.id;

    const model = uiModel();
    const list = [...(stateOf(p.id).models.length ? stateOf(p.id).models : p.suggested)];
    if (model && !list.includes(model)) list.unshift(model);
    if (!list.length) list.push('Model ekle');
    ms.innerHTML = '';
    list.forEach((m) => {
      const o = document.createElement('option');
      o.value = m;
      o.textContent = m;
      ms.append(o);
    });
    ms.value = model || list[0];

    const dl = $('aiModelList');
    if (dl) {
      dl.innerHTML = '';
      list.filter((m) => m !== 'Model ekle').forEach((m) => {
        const o = document.createElement('option');
        o.value = m;
        dl.append(o);
      });
    }
  }

  function renderComposerHint() {
    const n = lib.length;
    const left = limitLeft();
    const lim = A.limit ? (left > 0 ? left + ' soru kaldı' : 'günlük sınır doldu') : 'sınırsız soru';
    $('aiComposerHint').textContent = n + ' prompt · ' + lim;
  }

  function updateBusyUI() {
    const send = $('aiSend');
    if (!send) return;
    send.disabled = busy;
    send.textContent = busy ? 'Gönderiliyor…' : 'Gönder';
    $('aiStop').hidden = !busy;
  }

  function renderStatusChip() {
    const p = uiProvider();
    const ok = !!stateOf(p.id).key;
    const chip = $('aiStatusChip');
    chip.classList.toggle('ok', ok);
    chip.classList.toggle('warn', !ok);
    $('aiStatusText').textContent = ok ? p.name + ' · ' + (uiModel() || 'model seç') : p.name + ' · anahtar yok';
  }

  function renderHeroStats() {
    const box = $('aiHeroStats');
    if (!box) return;
    box.innerHTML = '';
    const connected = connectedProviders().length;
    const models = PROVIDERS.reduce((n, p) => n + (stateOf(p.id).key ? (stateOf(p.id).models || []).length : 0), 0);
    const u = totalUsage();
    [
      [connected, 'bağlı sağlayıcı'],
      [models, 'model'],
      [u.requests, 'istek bugün'],
      [lib.length, 'prompt']
    ].forEach(([v, label]) => {
      const s = el('div', 'ai-stat');
      s.append(el('b', null, String(v)), el('small', null, label));
      box.append(s);
    });
  }

  /* ---------- Chat actions ---------- */

  function newChat() {
    activeChatId = null;
    $('aiInput').value = '';
    growInput();
    closeSide();
    renderChatHeader();
    renderChatList();
    renderMessages();
    renderStatusChip();
  }

  function openChat(id) {
    const c = chats.find((x) => x.id === id);
    if (!c) return;
    activeChatId = c.id;
    if (BY[c.provider]) A.active.provider = c.provider;
    if (c.model) A.active.model = c.model;
    saveState();
    closeSide();
    renderChatHeader();
    renderChatList();
    renderMessages();
    renderStatusChip();
  }

  function ensureChat() {
    const p = ensureActive();
    const c = {
      id: uid('c'), title: 'Yeni sohbet', provider: p.id, model: A.active.model || firstModel(p.id),
      messages: [], created: Date.now(), updated: Date.now(), pinned: false
    };
    chats.push(c);
    activeChatId = c.id;
    saveChats();
    return c;
  }

  function growInput() {
    const ta = $('aiInput');
    ta.style.height = 'auto';
    ta.style.height = Math.min(160, Math.max(46, ta.scrollHeight)) + 'px';
  }

  async function send() {
    if (busy) return;
    const ta = $('aiInput');
    const text = ta.value.trim();
    if (!text) { toast('Önce bir mesaj yaz.'); ta.focus(); return; }
    const p = uiProvider();
    const st = stateOf(p.id);
    if (!st.key) {
      toast('Önce ' + p.name + ' için bir API anahtarı ekle.');
      switchTab('providers');
      openKeyDialog(p.id);
      return;
    }
    if (st && p.id === 'custom' && !providerBase(p)) {
      toast('Özel sağlayıcı için sunucu adresi gir.');
      switchTab('providers');
      return;
    }
    if (A.limit && totalUsage().requests >= A.limit) {
      toast('Bugünkü soru sınırına ulaştın (' + A.limit + '). Ayarlardan artırabilirsin.');
      return;
    }

    let c = activeChat();
    if (!c) c = ensureChat();
    c.provider = p.id;
    c.model = uiModel() || firstModel(p.id);
    if (!c.model) { toast('Bir model seç.'); switchTab('providers'); return; }
    A.active.provider = p.id;
    A.active.model = c.model;
    saveState();

    c.messages.push({ role: 'user', content: text, ts: Date.now() });
    c.updated = Date.now();
    if (!c.title || c.title === 'Yeni sohbet') c.title = titleFrom(text);
    ta.value = '';
    growInput();
    saveChats();
    renderChatHeader();
    renderChatList();
    renderMessages();
    await runAssistant(c);
  }

  async function runAssistant(c) {
    busy = true;
    updateBusyUI();
    renderMessages();
    try {
      const history = c.messages
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .slice(-24)
        .map((m) => ({ role: m.role, content: m.content }));
      const out = await ask(c.provider, c.model, history);
      c.messages.push({
        role: 'assistant', content: out.text, ts: Date.now(),
        provider: c.provider, model: c.model
      });
      c.updated = Date.now();
      bumpUsage(c.provider, out.tokens);
      saveChats();
    } catch (e) {
      c.messages.push({ role: 'error', content: e.message || 'İstek başarısız oldu.', ts: Date.now() });
      c.updated = Date.now();
      saveChats();
      toast(e.message || 'İstek başarısız oldu.');
    } finally {
      busy = false;
      updateBusyUI();
      renderMessages();
      renderChatList();
      renderHeroStats();
      renderUsage();
      renderStatusChip();
      renderChatHeader();
      renderProviders();
    }
  }

  async function regenerate() {
    if (busy) return;
    const c = activeChat();
    if (!c) return;
    let idx = -1;
    for (let i = c.messages.length - 1; i >= 0; i--) {
      if (c.messages[i].role === 'user') { idx = i; break; }
    }
    if (idx < 0) { toast('Yeniden denenecek bir mesaj yok.'); return; }
    if (!stateOf(c.provider).key) { toast('Bu sohbetin sağlayıcısı için anahtar yok.'); switchTab('providers'); return; }
    c.messages = c.messages.slice(0, idx + 1);
    saveChats();
    renderMessages();
    await runAssistant(c);
  }

  function stopRequest() {
    if (activeAbort) {
      try { activeAbort.abort(); } catch (e) { /* noop */ }
      toast('İstek durduruldu.');
    } else {
      toast('Bu istek platform tarafından durdurulamıyor; yanıt geldiğinde görünecek.');
    }
  }

  /* ---------- Prompt library ---------- */

  function insertPrompt(text) {
    switchTab('chat');
    const ta = $('aiInput');
    const current = ta.value.trim();
    ta.value = current ? current + '\n\n' + text : text;
    growInput();
    ta.focus();
    renderComposerHint();
  }

  function usePrompt(p) {
    p.uses = (p.uses || 0) + 1;
    p.updated = Date.now();
    saveLib();
    insertPrompt(p.text);
    renderPrompts();
    toast('Prompt sohbete eklendi.');
  }

  function promptCategories() {
    const set = new Set(CATS);
    lib.forEach((p) => { if (p.category) set.add(p.category); });
    return [...set].sort((a, b) => a.localeCompare(b, 'tr'));
  }

  function renderPrompts() {
    const grid = $('aiPromptGrid');
    if (!grid) return;
    const cats = promptCategories();
    const sel = $('aiPromptCat');
    if (sel) {
      sel.innerHTML = '';
      const all = document.createElement('option'); all.value = ''; all.textContent = 'Tüm kategoriler'; sel.append(all);
      cats.forEach((c) => {
        const o = document.createElement('option'); o.value = c; o.textContent = c; sel.append(o);
      });
      sel.value = cats.includes(promptCat) ? promptCat : '';
    }
    const chips = $('aiPromptCats');
    if (chips) {
      chips.innerHTML = '';
      ['', ...cats].forEach((c) => {
        const b = el('button', 'cat-chip' + (promptCat === c ? ' on' : ''), c || 'Tümü');
        b.type = 'button';
        b.onclick = () => { promptCat = c; renderPrompts(); };
        chips.append(b);
      });
    }
    const dl = $('aiCatList');
    if (dl) {
      dl.innerHTML = '';
      cats.forEach((c) => { const o = document.createElement('option'); o.value = c; dl.append(o); });
    }

    const q = (($('aiPromptSearch') && $('aiPromptSearch').value) || '').toLocaleLowerCase('tr').trim();
    const list = lib.filter((p) => {
      if (promptCat && p.category !== promptCat) return false;
      if (!q) return true;
      return (p.title + ' ' + p.text + ' ' + p.category + ' ' + (p.tags || []).join(' ')).toLocaleLowerCase('tr').includes(q);
    }).sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || (b.updated || 0) - (a.updated || 0));

    grid.innerHTML = '';
    if (!list.length) {
      const e = el('div', 'ai-prompt-empty');
      e.append(el('strong', null, lib.length ? 'Eşleşen prompt yok' : 'Kütüphane boş'));
      e.append(el('span', null, lib.length ? 'Arama veya kategori filtresini değiştir.' : 'İlk promptunu ekleyerek başla.'));
      grid.append(e);
      return;
    }

    list.forEach((p) => {
      const card = el('article', 'prompt-card');
      const head = el('div', 'pc-head');
      head.append(el('strong', null, p.title), el('span', 'cat-badge', p.category || 'Genel'));
      const text = el('p', 'pc-text', p.text);
      const tags = el('div', 'pc-tags');
      (p.tags || []).forEach((t) => tags.append(el('span', null, '#' + t)));
      const foot = el('div', 'pc-foot');
      const use = el('button', 'btn primary small', 'Kullan');
      const cp = el('button', 'btn secondary small', 'Kopyala');
      const ed = el('button', 'btn secondary small', 'Düzenle');
      const del = el('button', 'btn ghost small', 'Sil');
      [use, cp, ed, del].forEach((b) => { b.type = 'button'; });
      use.onclick = () => usePrompt(p);
      cp.onclick = () => copy(p.text);
      ed.onclick = () => openPromptEditor(p);
      del.onclick = () => {
        confirmBox('Promptu sil', '“' + p.title + '” kalıcı olarak silinecek. Bu işlem geri alınamaz.', 'Sil', () => {
          lib = lib.filter((x) => x.id !== p.id);
          saveLib(); renderPrompts(); renderHeroStats(); toast('Prompt silindi.');
        });
      };
      foot.append(use, cp, ed, del, el('span', 'uses', (p.uses || 0) + ' kullanım'));
      card.append(head, text, tags, foot);
      grid.append(card);
    });
  }

  function openPromptEditor(p) {
    editingPromptId = p ? p.id : null;
    $('aiPromptDlgT').textContent = p ? 'Promptu düzenle' : 'Yeni prompt';
    $('aiPromptTitle').value = p ? p.title : '';
    $('aiPromptCatInput').value = p ? (p.category || '') : (promptCat || '');
    $('aiPromptTags').value = p ? (p.tags || []).join(', ') : '';
    $('aiPromptText').value = p ? p.text : '';
    $('aiPromptDlg').hidden = false;
    setTimeout(() => $('aiPromptTitle').focus(), 50);
  }

  function savePromptEditor() {
    const title = $('aiPromptTitle').value.trim();
    const text = $('aiPromptText').value.trim();
    const category = $('aiPromptCatInput').value.trim() || 'Genel';
    const tags = $('aiPromptTags').value.split(',').map((x) => x.trim()).filter(Boolean).slice(0, 8);
    if (!title) { toast('Prompta bir başlık yaz.'); $('aiPromptTitle').focus(); return; }
    if (!text) { toast('Prompt metni boş olamaz.'); $('aiPromptText').focus(); return; }
    if (editingPromptId) {
      const p = lib.find((x) => x.id === editingPromptId);
      if (p) Object.assign(p, { title, text, category, tags, updated: Date.now() });
    } else {
      lib.push({ id: uid('pr'), title, text, category, tags, uses: 0, created: Date.now(), updated: Date.now() });
    }
    saveLib();
    $('aiPromptDlg').hidden = true;
    editingPromptId = null;
    promptCat = '';
    renderPrompts();
    renderHeroStats();
    toast('Prompt kaydedildi.');
  }

  function renderPicker() {
    const box = $('aiPickerList');
    if (!box) return;
    const q = ($('aiPickerSearch').value || '').toLocaleLowerCase('tr').trim();
    const list = lib.filter((p) => !q || (p.title + ' ' + p.text + ' ' + (p.tags || []).join(' ')).toLocaleLowerCase('tr').includes(q));
    box.innerHTML = '';
    if (!list.length) {
      box.append(el('p', 'hint', 'Eşleşen prompt yok. Prompt kütüphanesinden yeni bir prompt ekleyebilirsin.'));
      return;
    }
    list.forEach((p) => {
      const b = el('button');
      b.type = 'button';
      b.append(el('strong', null, p.title), el('small', null, (p.category || 'Genel') + ' · ' + p.text.slice(0, 90)));
      b.onclick = () => {
        $('aiPickerDlg').hidden = true;
        usePrompt(p);
      };
      box.append(b);
    });
  }

  /* ---------- Providers UI ---------- */

  function maskKey(key) {
    if (!key) return 'Anahtar yok';
    if (key.length <= 4) return '••••';
    return '•••• •••• ' + key.slice(-4);
  }

  function renderProviders() {
    const grid = $('aiProvGrid');
    if (!grid) return;
    grid.innerHTML = '';
    PROVIDERS.forEach((p) => {
      const st = stateOf(p.id);
      const on = !!st.key && (p.id !== 'custom' || !!st.base);
      const isDefault = A.defaults.provider === p.id;
      const test = st.test || null;
      const dotClass = on ? (test && test.ok === false ? 'bad' : 'ok') : '';
      const testLine = test
        ? (test.ok
          ? 'Son test: başarılı · ' + relativeTime(test.at) + (test.ms ? ' · ' + test.ms + ' ms' : '')
          : 'Son test başarısız · ' + relativeTime(test.at))
        : (on ? 'Bağlantı henüz test edilmedi.' : 'Anahtar ekleyerek başla.');
      const note = test && !test.ok
        ? '<div class="prov-note bad">' + esc(String(test.msg || '').slice(0, 160)) + '</div>'
        : '<div class="prov-note">' + esc(testLine) + '</div>';
      const card = el('div', 'prov-card' + (on ? ' connected' : '') + (isDefault ? ' is-default' : ''));
      card.dataset.p = p.id;
      let actions = '<div class="prov-actions">';
      actions += '<button type="button" class="btn ' + (on ? 'secondary' : 'primary') + ' small" data-act="key">' + (on ? 'Anahtarı değiştir' : 'Anahtar ekle') + '</button>';
      if (on) {
        actions += '<button type="button" class="btn secondary small" data-act="test">Test et</button>';
        actions += '<button type="button" class="btn secondary small" data-act="models">Modelleri yenile</button>';
        if (!isDefault) actions += '<button type="button" class="btn secondary small" data-act="default">Varsayılan yap</button>';
        else actions += '<span class="pill ok">Varsayılan</span>';
        actions += '<button type="button" class="btn ghost small" data-act="delete">Sil</button>';
      }
      if (p.docs) actions += '<button type="button" class="btn ghost small" data-act="docs">Anahtar al ↗</button>';
      actions += '</div>';
      const baseField = p.id === 'custom'
        ? '<div class="prov-custom"><input type="url" data-base value="' + esc(st.base || '') + '" placeholder="https://sunucu-adresi/v1" aria-label="Özel sağlayıcı adresi" autocomplete="off"><button type="button" class="btn secondary small" data-act="base">Kaydet</button></div>'
        : '';
      card.innerHTML =
        '<div class="prov-head">' +
        '<span class="prov-badge" style="--pc:' + p.color + '">' + esc(p.short) + '</span>' +
        '<div class="prov-head-copy"><strong>' + esc(p.name) + '</strong><small>' + esc(p.kind === 'anthropic' ? 'Messages API' : p.kind === 'google' ? 'Gemini API' : 'OpenAI uyumlu API') + '</small></div>' +
        '<span class="ai-dot ' + dotClass + '" title="' + (on ? 'Anahtar kayıtlı' : 'Bağlı değil') + '"></span>' +
        '</div>' +
        '<div class="prov-info"><span class="mask-key">' + esc(on ? maskKey(st.key) : 'Anahtar yok') + '</span>' +
        (st.models.length ? '<span class="pill">' + st.models.length + ' model</span>' : '') +
        (on ? '<span class="pill ' + (test && test.ok === false ? 'bad' : 'ok') + '">' + (test && test.ok === false ? 'bağlantı hatası' : 'anahtar kayıtlı') + '</span>' : '') +
        '</div>' + baseField + note + actions;
      grid.append(card);
    });
  }

  function renderUsage() {
    const total = $('aiUsageTotal');
    const rows = $('aiUsageRows');
    if (!total || !rows) return;
    const u = totalUsage();
    const connected = connectedProviders().length;
    const left = limitLeft();
    total.innerHTML = '';
    [
      [u.requests, 'istek · bugün'],
      [u.tokens, 'token · bugün'],
      [A.limit ? left : '∞', A.limit ? 'kalan soru' : 'sınırsız'],
      [connected, 'bağlı sağlayıcı']
    ].forEach(([v, label]) => {
      const s = el('div', 'stat');
      s.append(el('b', null, String(v)), el('small', null, label));
      total.append(s);
    });

    rows.innerHTML = '';
    const entries = Object.entries(rollUsage().providers).filter(([, x]) => x && x.requests > 0);
    if (!entries.length) {
      rows.append(el('p', 'hint', 'Bugün henüz bir istek yapılmadı. İlk sohbetini başlat.'));
      return;
    }
    const max = Math.max(1, ...entries.map(([, x]) => x.requests || 0));
    entries.sort((a, b) => (b[1].requests || 0) - (a[1].requests || 0)).forEach(([pid, x]) => {
      const p = BY[pid] || { name: pid };
      const row = el('div', 'usage-row');
      row.append(el('span', null, p.name));
      const bar = el('div', 'ubar');
      const fill = el('i');
      fill.style.width = Math.round(((x.requests || 0) / max) * 100) + '%';
      bar.append(fill);
      row.append(bar, el('em', null, (x.requests || 0) + ' istek'));
      rows.append(row);
    });
  }

  function renderSettingsAI() {
    const sp = $('setProvider');
    if (!sp) return;
    sp.innerHTML = '';
    PROVIDERS.forEach((p) => {
      const o = document.createElement('option');
      o.value = p.id;
      o.textContent = p.name + (stateOf(p.id).key ? ' ✓' : '');
      sp.append(o);
    });
    sp.value = BY[A.defaults.provider] ? A.defaults.provider : 'groq';
    const dp = BY[A.defaults.provider] || BY.groq;
    const models = [...(stateOf(dp.id).models.length ? stateOf(dp.id).models : dp.suggested)];
    const dl = $('aiModelList');
    if (dl) {
      dl.innerHTML = '';
      models.forEach((m) => { const o = document.createElement('option'); o.value = m; dl.append(o); });
    }
    $('setModel').value = A.defaults.model || models[0] || '';
    $('setLimit').value = A.limit;
    $('setReplyLang').value = A.replyLang;
    $('setTemp').value = A.temp;
    $('setTempV').textContent = Number(A.temp).toFixed(1);
    $('setSystem').value = A.system || '';
    $('setStoreKeys').checked = A.storeKeys;
  }

  /* ---------- Provider actions ---------- */

  function openKeyDialog(pid) {
    const p = BY[pid];
    if (!p) return;
    keyProvider = pid;
    $('aiKeyT').textContent = p.name + ' API anahtarı';
    $('aiKeySub').textContent = 'Anahtarını sağlayıcı panelinden oluştur. Yalnızca son 4 karakteri arayüzde gösterilecek.';
    $('aiKeyHintText').textContent = p.hint ? 'Anahtarlar genellikle “' + p.hint + '” ile başlar.' : '';
    $('aiKeyInput').value = '';
    $('aiKeyInput').type = 'password';
    $('aiKeyRemember').checked = A.storeKeys;
    $('aiKeyDocs').hidden = !p.docs;
    $('aiKeyDlg').hidden = false;
    setTimeout(() => $('aiKeyInput').focus(), 60);
  }

  async function saveKeyDialog() {
    const p = BY[keyProvider];
    if (!p) return;
    const key = $('aiKeyInput').value.trim();
    if (!key) { toast('Anahtar boş olamaz.'); $('aiKeyInput').focus(); return; }
    if (key.length < 8) { toast('Anahtar çok kısa görünüyor.'); $('aiKeyInput').focus(); return; }
    const remember = $('aiKeyRemember').checked;
    A.storeKeys = remember;
    const st = stateOf(p.id);
    const wasConnected = connectedProviders().length > 0;
    st.key = key;
    st.test = null;
    st.updated = Date.now();
    saveState();
    $('aiKeyDlg').hidden = true;
    $('aiKeyInput').value = '';
    toast(p.name + ': anahtar kaydedildi, bağlantı test ediliyor…');
    const ok = await testProvider(p.id, true);
    if (ok) {
      const first = st.models[0] || p.suggested[0] || '';
      if (!wasConnected) {
        A.defaults.provider = p.id;
        A.defaults.model = first;
        A.active.provider = p.id;
        A.active.model = first;
      } else if (A.defaults.provider === p.id) {
        A.defaults.model = A.defaults.model || first;
      }
      if (A.active.provider === p.id && !A.active.model) A.active.model = first;
      saveState();
      toast(p.name + ' bağlandı · ' + st.models.length + ' model bulundu.');
    } else {
      toast(p.name + ': anahtar kaydedildi ancak bağlantı kurulamadı. Anahtarı kontrol et.');
    }
    renderAll();
    renderSettingsAI();
  }

  function deleteKey(pid) {
    const p = BY[pid];
    confirmBox('Anahtarı sil', p.name + ' için kayıtlı API anahtarı bu cihazdan silinecek. Sohbetlerin ve promptların korunur.', 'Sil', () => {
      delete A.keys[pid];
      const fallback = connectedProviders()[0];
      if (A.active.provider === pid) {
        if (fallback) { A.active.provider = fallback.id; A.active.model = firstModel(fallback.id); }
        else A.active.model = '';
      }
      if (A.defaults.provider === pid) {
        A.defaults.provider = fallback ? fallback.id : 'groq';
        A.defaults.model = fallback ? firstModel(fallback.id) : 'llama-3.3-70b-versatile';
      }
      saveState();
      renderAll();
      renderSettingsAI();
      toast('Anahtar silindi.');
    });
  }

  function setDefault(pid) {
    const p = BY[pid];
    const model = firstModel(pid);
    A.defaults = { provider: pid, model };
    if (!activeChat()) { A.active.provider = pid; A.active.model = model; }
    saveState();
    renderProviders();
    renderSettingsAI();
    renderStatusChip();
    toast(p.name + ' varsayılan sağlayıcı yapıldı.');
  }

  async function refreshModelsFor(pid, quiet) {
    const p = BY[pid];
    const st = stateOf(pid);
    if (!st.key) { toast(p.name + ': önce anahtar ekle.'); openKeyDialog(pid); return; }
    const started = Date.now();
    try {
      const ids = await listModels(p);
      st.test = { ok: true, at: Date.now(), ms: Date.now() - started, count: ids.length };
      const c = activeChat();
      if (c && c.provider === pid && !ids.includes(c.model)) { c.model = ids[0]; saveChats(); }
      if (A.active.provider === pid && !ids.includes(A.active.model)) A.active.model = ids[0];
      if (A.defaults.provider === pid && !ids.includes(A.defaults.model)) A.defaults.model = ids[0];
      saveState();
      renderAll();
      renderSettingsAI();
      if (!quiet) toast(p.name + ': ' + ids.length + ' model bulundu.');
    } catch (e) {
      st.test = { ok: false, at: Date.now(), msg: e.message };
      saveState();
      renderProviders();
      toast(e.message);
    }
  }

  async function testAllProviders() {
    const list = connectedProviders();
    if (!list.length) { toast('Önce en az bir API anahtarı ekle.'); return; }
    const btn = $('aiTestAll');
    btn.disabled = true;
    for (const p of list) {
      btn.textContent = p.name + ' test ediliyor…';
      await testProvider(p.id, true);
    }
    btn.disabled = false;
    btn.textContent = 'Tüm bağlantıları test et';
    renderAll();
    toast('Bağlantı testleri tamamlandı.');
  }

  /* ---------- Chat management ---------- */

  let confirmActionHolder = null;
  function confirmBox(title, text, okLabel, fn) {
    $('aiConfirmT').textContent = title;
    $('aiConfirmX').textContent = text;
    $('aiConfirmOk').textContent = okLabel || 'Sil';
    confirmActionHolder = fn;
    $('aiConfirm').hidden = false;
  }

  function openRename() {
    const c = activeChat();
    if (!c) { toast('Önce bir sohbet başlat.'); return; }
    $('aiNameInput').value = c.title;
    $('aiNameDlg').hidden = false;
    setTimeout(() => { const i = $('aiNameInput'); i.focus(); i.select(); }, 50);
  }

  function saveRename() {
    const c = activeChat();
    if (!c) return;
    const t = $('aiNameInput').value.trim();
    if (!t) { toast('Başlık boş olamaz.'); return; }
    c.title = t.slice(0, 70);
    c.updated = Date.now();
    saveChats();
    $('aiNameDlg').hidden = true;
    renderChatHeader();
    renderChatList();
  }

  function exportChat() {
    const c = activeChat();
    if (!c) { toast('Dışa aktarılacak sohbet yok.'); return; }
    const p = BY[c.provider] || { name: 'AI' };
    const body = c.messages.filter((m) => m.role !== 'error').map((m) =>
      '**' + (m.role === 'user' ? 'Sen' : p.name + ' · ' + (m.model || '')) + ':**\n\n' + m.content
    ).join('\n\n---\n\n');
    const md = '# ' + c.title + '\n\n' + p.name + ' · ' + c.model + ' · ' + new Date(c.created).toLocaleString('tr-TR') + '\n\n' + body + '\n';
    const slug = (c.title || 'sohbet').toLocaleLowerCase('tr').replace(/[^a-z0-9çğıöşü]+/gi, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'sohbet';
    saveFile(slug + '.md', md, 'Sohbet Markdown olarak indirildi.');
  }

  function clearActiveMessages() {
    const c = activeChat();
    if (!c) { toast('Önce bir sohbet başlat.'); return; }
    confirmBox('Mesajları temizle', '“' + c.title + '” sohbetindeki tüm mesajlar silinecek. Sohbet kaydı boş olarak kalır.', 'Temizle', () => {
      c.messages = [];
      c.updated = Date.now();
      saveChats();
      renderChatHeader();
      renderChatList();
      renderMessages();
      renderHeroStats();
      toast('Sohbet mesajları temizlendi.');
    });
  }

  function deleteActiveChat() {
    const c = activeChat();
    if (!c) { toast('Silinecek sohbet yok.'); return; }
    confirmBox('Sohbeti sil', '“' + c.title + '” kalıcı olarak silinecek. Bu işlem geri alınamaz.', 'Sil', () => {
      chats = chats.filter((x) => x.id !== c.id);
      activeChatId = null;
      saveChats();
      renderChatList();
      renderChatHeader();
      renderMessages();
      renderHeroStats();
      toast('Sohbet silindi.');
    });
  }

  function togglePin() {
    const c = activeChat();
    if (!c) { toast('Önce bir sohbet başlat.'); return; }
    c.pinned = !c.pinned;
    c.updated = Date.now();
    saveChats();
    renderChatList();
    renderChatHeader();
    toast(c.pinned ? 'Sohbet sabitlendi.' : 'Sabitleme kaldırıldı.');
  }

  /* ---------- Ideas ---------- */

  function parseIdeas(text) {
    const s = String(text || '').replace(/```json/gi, '```').replace(/```/g, '');
    const a = s.indexOf('['), b = s.lastIndexOf(']');
    if (a >= 0 && b > a) {
      try { const j = JSON.parse(s.slice(a, b + 1)); if (Array.isArray(j)) return j; } catch (e) { /* try object */ }
    }
    const oa = s.indexOf('{'), ob = s.lastIndexOf('}');
    if (oa >= 0 && ob > oa) {
      try {
        const j = JSON.parse(s.slice(oa, ob + 1));
        if (j && Array.isArray(j.ideas)) return j.ideas;
      } catch (e) { /* ignore */ }
    }
    return null;
  }

  function ideaToProject(it) {
    if (!it || typeof it !== 'object') return;
    PL.newProject();
    if (!PL.current()) return;
    const game = $('game'), topic = $('topic'), tags = $('tags'), notes = $('notes');
    if (game) game.value = String(it.game || '');
    if (topic) topic.value = String(it.topic || '');
    if (tags) tags.value = String(it.tags || '');
    if (notes && it.title) notes.value = 'Başlık fikri: ' + String(it.title);
    PL.render();
    PL.persist();
    toast('Proje taslağı hazır. Kaydetmeyi unutma.');
  }

  async function generateIdeas() {
    if (busy) return;
    const p = uiProvider();
    const st = stateOf(p.id);
    if (!st.key) { toast('Önce ' + p.name + ' için anahtar ekle.'); switchTab('providers'); openKeyDialog(p.id); return; }
    const out = $('aiIdeaOut');
    out.className = 'ideas loading';
    out.textContent = 'Fikirler üretiliyor…';
    const L = PL.live();
    const games = [...new Set(L.map((x) => x.name).filter(Boolean))].slice(0, 12);
    const tagCount = {};
    L.forEach((x) => String(x.values.tags || '').split(',').map((t) => t.trim().toLowerCase()).filter(Boolean).forEach((t) => { tagCount[t] = (tagCount[t] || 0) + 1; }));
    const tags = Object.entries(tagCount).sort((a, b) => b[1] - a[1]).slice(0, 8).map((x) => x[0]);
    const ctx = $('aiIdeaCtx').value.trim();
    const prompt = 'Sen deneyimli bir YouTube oyun içerik stratejistisin. Türkçe bir oyun kanalı için 8 farklı video fikri öner.\n\n' +
      'Kanalın oynadığı oyunlar: ' + (games.join(', ') || 'henüz yok') + '\n' +
      'Sık kullanılan etiketler: ' + (tags.join(', ') || 'henüz yok') + '\n' +
      'Ek istek: ' + (ctx || 'yok') + '\n\n' +
      'Sadece geçerli bir JSON dizisi döndür, başka metin yazma. Her eleman şu alanlara sahip olsun: ' +
      '{"game":"oyun adı","topic":"videonun konusu ve önemli anları (1-2 cümle)","title":"merak uyandıran örnek başlık","tags":"virgülle ayrılmış 2-3 etiket"}';
    busy = true;
    updateBusyUI();
    try {
      const result = await ask(p.id, uiModel(), [{ role: 'user', content: prompt }],
        'Sen YouTube oyun içeriği stratejistisin. Yalnızca geçerli JSON döndür. Başka açıklama yazma.');
      bumpUsage(p.id, result.tokens);
      const arr = parseIdeas(result.text);
      out.className = 'ideas';
      out.innerHTML = '';
      if (!arr || !arr.length) {
        const card = el('div', 'ideacard');
        card.append(el('strong', null, 'Yanıt JSON olarak ayrıştırılamadı'), el('p', null, result.text));
        const cp = el('button', 'btn secondary small', 'Yanıtı kopyala');
        cp.type = 'button'; cp.onclick = () => copy(result.text);
        card.append(cp);
        out.append(card);
      } else {
        arr.slice(0, 10).forEach((it) => {
          if (!it || typeof it !== 'object') return;
          const card = el('div', 'ideacard');
          card.append(el('strong', null, String(it.title || it.topic || 'Fikir')));
          if (it.game) card.append(el('div', 'hint', 'Oyun: ' + String(it.game)));
          card.append(el('p', null, String(it.topic || '')));
          if (it.tags) card.append(el('small', 'tags', String(it.tags).split(',').map((x) => x.trim()).filter(Boolean).map((x) => '#' + x).join('  ')));
          const b = el('button', 'btn secondary small', 'Projeye çevir');
          b.type = 'button';
          b.onclick = () => ideaToProject(it);
          card.append(b);
          out.append(card);
        });
      }
      renderHeroStats();
      renderUsage();
      renderComposerHint();
    } catch (e) {
      out.className = 'ideas';
      out.innerHTML = '';
      const card = el('div', 'ideacard');
      card.append(el('strong', null, 'Fikirler üretilemedi'), el('p', null, e.message || 'Bir hata oldu.'));
      const retry = el('button', 'btn secondary small', 'Tekrar dene');
      retry.type = 'button'; retry.onclick = () => generateIdeas();
      card.append(retry);
      out.append(card);
      toast(e.message || 'Fikirler üretilemedi.');
    } finally {
      busy = false;
      updateBusyUI();
    }
  }

  /* ---------- Settings wiring ---------- */

  function bindSettings() {
    $('setProvider').addEventListener('change', (e) => {
      const pid = e.target.value;
      if (!BY[pid]) return;
      const model = firstModel(pid);
      A.defaults.provider = pid;
      A.defaults.model = model;
      if (!activeChat()) { A.active.provider = pid; A.active.model = model; }
      saveState();
      renderSettingsAI();
      renderStatusChip();
      renderHeroStats();
      renderChatHeader();
    });
    $('setModel').addEventListener('input', (e) => {
      A.defaults.model = e.target.value.trim();
      if (!activeChat() && A.active.provider === A.defaults.provider) A.active.model = A.defaults.model;
      saveState();
      renderChatHeader();
      renderStatusChip();
    });
    $('setLimit').addEventListener('change', (e) => {
      A.limit = clamp(parseInt(e.target.value, 10) || 0, 0, 1000);
      e.target.value = A.limit;
      saveState();
      renderComposerHint();
      renderUsage();
    });
    $('setReplyLang').addEventListener('change', (e) => { A.replyLang = e.target.value; saveState(); });
    $('setTemp').addEventListener('input', (e) => {
      A.temp = clamp(Number(e.target.value), 0, 1.5);
      $('setTempV').textContent = A.temp.toFixed(1);
    });
    $('setTemp').addEventListener('change', () => { saveState(); });
    $('setSystem').addEventListener('input', (e) => {
      clearTimeout(systemTimer);
      systemTimer = setTimeout(() => { A.system = e.target.value; saveState(); }, 500);
    });
    $('setStoreKeys').addEventListener('change', (e) => {
      A.storeKeys = e.target.checked;
      saveState();
      toast(e.target.checked ? 'Anahtarlar bu cihazda saklanacak.' : 'Anahtarlar yalnızca bu oturumda tutulacak; uygulama kapanınca silinecek.');
    });
    $('setAIOpen').addEventListener('click', () => PL.showAI());
    $('setAIClear').addEventListener('click', () => {
      confirmBox('AI verilerini temizle', 'Sohbet geçmişi, prompt kütüphanesi, kullanım sayaçları ve bu cihazdaki API anahtarları silinecek. Projelerine ve görünüm ayarlarına dokunulmaz.', 'Temizle', () => {
        try {
          localStorage.removeItem(CHAT_KEY);
          localStorage.removeItem(LIB_KEY);
          localStorage.removeItem(AI_KEY);
        } catch (e) { /* ignore */ }
        const keepStore = A.storeKeys;
        A = defaults();
        A.storeKeys = keepStore;
        A.seeded = true;
        A.migrated = true;
        chats = [];
        lib = seedPrompts();
        activeChatId = null;
        saveState();
        saveLib();
        renderAll();
        renderSettingsAI();
        toast('AI verileri temizlendi.');
      });
    });
  }

  /* ---------- Tabs, dialogs, bindings ---------- */

  function switchTab(next) {
    tab = next;
    document.querySelectorAll('#aiTabs [data-aitab]').forEach((b) => {
      const on = b.dataset.aitab === tab;
      b.classList.toggle('on', on);
      b.setAttribute('aria-selected', String(on));
    });
    const panes = { chat: 'aiTabChat', ideas: 'aiTabIdeas', prompts: 'aiTabPrompts', providers: 'aiTabProviders' };
    Object.entries(panes).forEach(([k, id]) => { const n = $(id); if (n) n.hidden = k !== tab; });
    closeSide();
    if (tab === 'chat') { renderChatHeader(); renderChatList(); renderMessages(); }
    if (tab === 'prompts') renderPrompts();
    if (tab === 'providers') { renderProviders(); renderUsage(); }
    if (tab === 'ideas') renderHeroStats();
  }

  function closeSide() {
    const s = $('aiSide');
    if (s) s.classList.remove('open');
  }

  function closeTopDialogs() {
    let closed = false;
    ['aiKeyDlg', 'aiPromptDlg', 'aiNameDlg', 'aiConfirm', 'aiPickerDlg'].forEach((id) => {
      const n = $(id);
      if (n && !n.hidden) { n.hidden = true; closed = true; }
    });
    const menu = $('aiMenu');
    if (menu && !menu.hidden) { menu.hidden = true; closed = true; }
    const side = $('aiSide');
    if (side && side.classList.contains('open')) { side.classList.remove('open'); closed = true; }
    if (closed && $('aiKeyInput')) $('aiKeyInput').value = '';
    return closed;
  }

  function renderAll() {
    ensureActive();
    renderHeaderSelects();
    renderChatHeader();
    renderChatList();
    renderMessages();
    renderHeroStats();
    renderStatusChip();
    renderPrompts();
    renderProviders();
    renderUsage();
    renderComposerHint();
  }

  function bind() {
    document.querySelectorAll('#aiTabs [data-aitab]').forEach((b) => {
      b.addEventListener('click', () => switchTab(b.dataset.aitab));
    });

    $('aiNewChat').onclick = newChat;
    $('aiChatSearch').addEventListener('input', () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(renderChatList, 120);
    });
    $('aiSideToggle').onclick = () => $('aiSide').classList.toggle('open');
    $('aiSideClose').onclick = closeSide;

    $('aiProvSel').addEventListener('change', (e) => {
      const pid = e.target.value;
      const p = BY[pid];
      if (!p) return;
      const model = firstModel(pid);
      A.active.provider = pid;
      A.active.model = model;
      const c = activeChat();
      if (c) { c.provider = pid; c.model = model; c.updated = Date.now(); saveChats(); }
      saveState();
      renderChatHeader();
      renderChatList();
      renderStatusChip();
    });
    $('aiModelSel').addEventListener('change', (e) => {
      const model = e.target.value;
      A.active.model = model;
      const c = activeChat();
      if (c) { c.model = model; c.updated = Date.now(); saveChats(); }
      saveState();
      renderChatHeader();
      renderChatList();
    });
    $('aiModelRefresh').onclick = () => refreshModelsFor(uiProvider().id);

    $('aiSend').onclick = send;
    $('aiStop').onclick = stopRequest;
    $('aiInput').addEventListener('input', growInput);
    $('aiInput').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); send(); }
    });

    $('aiPromptPick').onclick = () => {
      $('aiPickerSearch').value = '';
      renderPicker();
      $('aiPickerDlg').hidden = false;
      setTimeout(() => $('aiPickerSearch').focus(), 50);
    };
    $('aiPickerSearch').addEventListener('input', renderPicker);
    $('aiPickerClose').onclick = () => { $('aiPickerDlg').hidden = true; };

    $('aiChatMenu').addEventListener('click', (e) => {
      e.stopPropagation();
      if (!activeChat()) { toast('Önce bir sohbet başlat.'); return; }
      const menu = $('aiMenu');
      const pinBtn = menu.querySelector('[data-act="pin"]');
      const c = activeChat();
      if (pinBtn) pinBtn.textContent = c && c.pinned ? '★ Sabitlemeyi kaldır' : '★ Sabitle';
      menu.hidden = !menu.hidden;
    });
    $('aiMenu').addEventListener('click', (e) => {
      const b = e.target.closest('button[data-act]');
      if (!b) return;
      const act = b.dataset.act;
      $('aiMenu').hidden = true;
      if (act === 'rename') openRename();
      if (act === 'pin') togglePin();
      if (act === 'export') exportChat();
      if (act === 'clear') clearActiveMessages();
      if (act === 'delete') deleteActiveChat();
    });
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#aiMenu') && !e.target.closest('#aiChatMenu')) {
        const m = $('aiMenu'); if (m) m.hidden = true;
      }
    });

    $('aiNameSave').onclick = saveRename;
    $('aiNameCancel').onclick = () => { $('aiNameDlg').hidden = true; };
    $('aiNameInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); saveRename(); } });

    $('aiConfirmCancel').onclick = () => { confirmActionHolder = null; $('aiConfirm').hidden = true; };
    $('aiConfirmOk').onclick = () => {
      const fn = confirmActionHolder;
      confirmActionHolder = null;
      $('aiConfirm').hidden = true;
      if (fn) fn();
    };

    $('aiPromptNew').onclick = () => openPromptEditor(null);
    $('aiPromptSearch').addEventListener('input', () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(renderPrompts, 120);
    });
    $('aiPromptCat').addEventListener('change', (e) => { promptCat = e.target.value; renderPrompts(); });
    $('aiPromptSave').onclick = savePromptEditor;
    $('aiPromptCancel').onclick = () => { $('aiPromptDlg').hidden = true; editingPromptId = null; };

    $('aiProvGrid').addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-act]');
      if (!btn) return;
      const card = e.target.closest('.prov-card');
      if (!card) return;
      const pid = card.dataset.p;
      const act = btn.dataset.act;
      if (act === 'key') openKeyDialog(pid);
      else if (act === 'test') testProvider(pid);
      else if (act === 'models') refreshModelsFor(pid);
      else if (act === 'default') setDefault(pid);
      else if (act === 'delete') deleteKey(pid);
      else if (act === 'docs') { const p = BY[pid]; if (p && p.docs) openExt(p.docs); }
      else if (act === 'base') {
        const input = card.querySelector('input[data-base]');
        const base = (input && input.value || '').trim().replace(/\/+$/, '');
        if (!base) { toast('Sunucu adresi boş olamaz.'); return; }
        if (!/^https?:\/\/[^\s]+$/i.test(base)) { toast('Adres http:// veya https:// ile başlamalı.'); return; }
        if (/^http:\/\//i.test(base)) toast('Uyarı: HTTP şifresiz bağlantıdır; yalnızca güvendiğin sunucularda kullan.');
        stateOf(pid).base = base;
        stateOf(pid).test = null;
        saveState();
        renderProviders();
        toast('Sunucu adresi kaydedildi.');
      }
    });
    $('aiTestAll').onclick = testAllProviders;

    $('aiKeySave').onclick = saveKeyDialog;
    $('aiKeyCancel').onclick = () => { $('aiKeyDlg').hidden = true; $('aiKeyInput').value = ''; };
    $('aiKeyInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); saveKeyDialog(); } });
    $('aiKeyDocs').onclick = () => { const p = BY[keyProvider]; if (p && p.docs) openExt(p.docs); };

    $('aiIdeaGo').onclick = generateIdeas;

    bindSettings();

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeTopDialogs();
    });
    ['aiKeyDlg', 'aiPromptDlg', 'aiNameDlg', 'aiConfirm', 'aiPickerDlg'].forEach((id) => {
      const w = $(id);
      if (!w) return;
      w.addEventListener('click', (e) => {
        if (e.target === w) {
          w.hidden = true;
          if (id === 'aiKeyDlg') $('aiKeyInput').value = '';
        }
      });
    });

    document.addEventListener('pl:view', (e) => {
      if (e.detail === 'ai') {
        renderAll();
        switchTab(tab === 'chat' ? 'chat' : tab);
      } else if (e.detail === 'settings') {
        renderSettingsAI();
      }
    });
  }

  /* ---------- Boot ---------- */

  loadState();
  loadChats();
  loadLib();
  bind();
  renderAll();
  renderSettingsAI();

  window.AI = {
    open: () => PL.showAI(),
    closeTop: closeTopDialogs,
    refresh: () => { renderAll(); renderSettingsAI(); }
  };
})();
