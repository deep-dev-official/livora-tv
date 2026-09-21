/**
 * @author DEEP_DEV
 */

const BASE_URL = window.location.origin.includes('github.io')
  ? `${window.location.origin}/livora-tv`
  : window.location.origin;

let hlsInstance = null;
let allChannels = [];

async function initPortal() {
  const video = document.getElementById('videoPlayer');
  const streamInput = document.getElementById('streamUrlInput');
  const playBtn = document.getElementById('playStreamBtn');
  const statusMsg = document.getElementById('playerStatus');

  playBtn.addEventListener('click', () => {
    const url = streamInput.value.trim();
    if (url) {
      loadStream(url, video, statusMsg);
    }
  });

  try {
    const statsRes = await fetch('stats.json');
    if (statsRes.ok) {
      const stats = await statsRes.json();
      renderStats(stats);
      renderPlaylists(stats);
    }
  } catch (e) {
    renderDefaultPlaylists();
  }

  try {
    const chanRes = await fetch('../channels/channels.json');
    if (chanRes.ok) {
      const data = await chanRes.json();
      allChannels = data.filter(c => c.streams && c.streams.some(s => s.status === 'active'));
      setupFilters();
      renderChannels(allChannels);
    }
  } catch (e) {
    fetch('sample_channels.json')
      .then(res => res.json())
      .then(data => {
        allChannels = data;
        setupFilters();
        renderChannels(allChannels);
      })
      .catch(() => {});
  }
}

function renderStats(stats) {
  document.getElementById('statChannels').textContent = stats.total_channels || 0;
  document.getElementById('statStreams').textContent = stats.total_active_streams || 0;
  document.getElementById('statCountries').textContent = stats.total_countries || 0;
  document.getElementById('statLanguages').textContent = stats.total_languages || 0;
  document.getElementById('statCategories').textContent = stats.total_categories || 0;

  if (stats.last_updated) {
    const date = new Date(stats.last_updated);
    document.getElementById('statUpdated').textContent = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}

function renderPlaylists(stats) {
  const container = document.getElementById('playlistsGrid');
  container.innerHTML = '';

  const defaultList = [
    { title: 'Master Playlist', badge: 'All Verified', path: 'playlists/index.m3u' },
    { title: 'India', badge: 'Regional', path: 'playlists/india.m3u' },
    { title: 'Bangladesh', badge: 'Regional', path: 'playlists/bangladesh.m3u' },
    { title: 'News', badge: 'Category', path: 'playlists/news.m3u' },
    { title: 'Sports', badge: 'Category', path: 'playlists/sports.m3u' },
    { title: 'Entertainment', badge: 'Category', path: 'playlists/entertainment.m3u' },
    { title: 'Movies', badge: 'Category', path: 'playlists/movies.m3u' },
    { title: 'Music', badge: 'Category', path: 'playlists/music.m3u' },
    { title: 'Kids', badge: 'Category', path: 'playlists/kids.m3u' },
    { title: 'Bengali', badge: 'Language', path: 'playlists/bengali.m3u' },
    { title: 'Hindi', badge: 'Language', path: 'playlists/hindi.m3u' },
    { title: 'English', badge: 'Language', path: 'playlists/english.m3u' }
  ];

  for (const item of defaultList) {
    const fullUrl = `${BASE_URL}/${item.path}`;
    const card = document.createElement('div');
    card.className = 'playlist-card';
    card.innerHTML = `
      <div class="playlist-header">
        <span class="playlist-title">${item.title}</span>
        <span class="playlist-badge">${item.badge}</span>
      </div>
      <div class="playlist-url" title="${fullUrl}">${fullUrl}</div>
      <button class="copy-btn" data-url="${fullUrl}">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
        Copy URL
      </button>
    `;

    card.querySelector('.copy-btn').addEventListener('click', (e) => {
      const btn = e.currentTarget;
      navigator.clipboard.writeText(btn.getAttribute('data-url')).then(() => {
        const originalText = btn.innerHTML;
        btn.innerHTML = 'Copied!';
        setTimeout(() => { btn.innerHTML = originalText; }, 2000);
      });
    });

    container.appendChild(card);
  }
}

function renderDefaultPlaylists() {
  renderPlaylists({});
}

function setupFilters() {
  const countrySelect = document.getElementById('countryFilter');
  const catSelect = document.getElementById('categoryFilter');
  const searchInput = document.getElementById('channelSearch');

  const countries = new Set();
  const categories = new Set();

  for (const c of allChannels) {
    if (c.countryName) countries.add(c.countryName);
    if (c.category) categories.add(c.category);
  }

  for (const country of Array.from(countries).sort()) {
    const opt = document.createElement('option');
    opt.value = country;
    opt.textContent = country;
    countrySelect.appendChild(opt);
  }

  for (const cat of Array.from(categories).sort()) {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    catSelect.appendChild(opt);
  }

  function applyFilter() {
    const q = searchInput.value.toLowerCase().trim();
    const selCountry = countrySelect.value;
    const selCat = catSelect.value;

    const filtered = allChannels.filter(c => {
      const matchesSearch = !q || c.name.toLowerCase().includes(q) || (c.countryName && c.countryName.toLowerCase().includes(q));
      const matchesCountry = !selCountry || c.countryName === selCountry;
      const matchesCat = !selCat || c.category === selCat;
      return matchesSearch && matchesCountry && matchesCat;
    });

    renderChannels(filtered);
  }

  searchInput.addEventListener('input', applyFilter);
  countrySelect.addEventListener('change', applyFilter);
  catSelect.addEventListener('change', applyFilter);
}

function renderChannels(channels) {
  const container = document.getElementById('channelList');
  container.innerHTML = '';

  const displayList = channels.slice(0, 60);

  if (displayList.length === 0) {
    container.innerHTML = '<div style="color: var(--deep-dev-text-dim); padding: 20px;">No channels found matching the filter criteria.</div>';
    return;
  }

  for (const ch of displayList) {
    const activeStream = (ch.streams || []).find(s => s.status === 'active') || ch.streams?.[0];
    const card = document.createElement('div');
    card.className = 'channel-card';
    const logoSrc = ch.logo || 'https://raw.githubusercontent.com/iptv-org/api/master/assets/images/no-logo.png';

    card.innerHTML = `
      <div class="channel-logo-wrap">
        <img src="${logoSrc}" alt="${ch.name}" class="channel-logo" loading="lazy" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' viewBox=\\'0 0 24 24\\' fill=\\'%2364748b\\'%3E%3Crect width=\\'24\\' height=\\'24\\' rx=\\'4\\' fill=\\'%23151c2c\\'/%3E%3Ctext x=\\'50%25\\' y=\\'55%25\\' fill=\\'%2394a3b8\\' font-size=\\'10\\' text-anchor=\\'middle\\' dominant-baseline=\\'middle\\'%3ETV%3C/text%3E%3C/svg%3E'">
      </div>
      <div class="channel-info">
        <div class="channel-name" title="${ch.name}">${ch.name}</div>
        <div class="channel-meta">
          <span>${ch.countryName || ch.country || 'INT'}</span>
          <span>•</span>
          <span>${ch.category || 'General'}</span>
        </div>
      </div>
      ${activeStream ? `<button class="play-channel-btn" data-url="${activeStream.url}">Test Play</button>` : ''}
    `;

    if (activeStream) {
      card.querySelector('.play-channel-btn').addEventListener('click', () => {
        document.getElementById('streamUrlInput').value = activeStream.url;
        loadStream(activeStream.url, document.getElementById('videoPlayer'), document.getElementById('playerStatus'));
        window.location.hash = '#player';
      });
    }

    container.appendChild(card);
  }
}

function loadStream(url, video, statusEl) {
  statusEl.textContent = `Connecting to stream: ${url}...`;
  statusEl.style.color = 'var(--deep-dev-text-muted)';

  if (hlsInstance) {
    hlsInstance.destroy();
    hlsInstance = null;
  }

  if (Hls.isSupported()) {
    hlsInstance = new Hls({
      enableWorker: true,
      lowLatencyMode: true,
      backBufferLength: 60
    });
    hlsInstance.loadSource(url);
    hlsInstance.attachMedia(video);

    hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
      statusEl.textContent = 'Stream connected successfully. Playing...';
      statusEl.style.color = 'var(--deep-dev-success)';
      video.play().catch(() => {});
    });

    hlsInstance.on(Hls.Events.ERROR, (event, data) => {
      if (data.fatal) {
        statusEl.textContent = `Playback error: ${data.details || 'Unable to play stream directly due to CORS or codec restrictions'}`;
        statusEl.style.color = '#ef4444';
      }
    });
  } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
    video.src = url;
    video.addEventListener('loadedmetadata', () => {
      statusEl.textContent = 'Stream playing (Native Safari HLS).';
      statusEl.style.color = 'var(--deep-dev-success)';
      video.play().catch(() => {});
    });
  } else {
    statusEl.textContent = 'HLS playback is not supported in this browser.';
    statusEl.style.color = '#ef4444';
  }
}

document.addEventListener('DOMContentLoaded', initPortal);
