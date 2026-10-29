'use strict';

/* ------------------------------------------------------------------
 * Trip data
 * ------------------------------------------------------------------ */
const TRIP_LENGTH_DAYS = 10;

// The 10-day route, one entry per day. `places` are the photo groups shown that day.
const ITINERARY = [
  { title: 'Catania & Aci Trezza', text: 'Duomo, Via Etnea, the fish market (La Pescheria) and sunset at the Cyclops rocks.', places: ['Catania', 'Aci Trezza'] },
  { title: 'Mount Etna', text: 'Silvestri craters, a jeep or cable-car trip up the volcano and a winery on its slopes.', places: ['Etna'] },
  { title: 'Taormina', text: 'Greek theatre, Corso Umberto, Isola Bella and the view from Castelmola.', places: ['Taormina'] },
  { title: 'Siracusa & Ortigia', text: 'Neapolis archaeological park, the Ear of Dionysius and the island of Ortigia.', places: ['Siracusa'] },
  { title: 'Noto & Marzamemi', text: 'Baroque golden stone in Noto, then a fishing village dinner in Marzamemi.', places: ['Noto', 'Marzamemi'] },
  { title: 'Ragusa Ibla & Modica', text: 'Hill-top baroque towns and the famous Modica chocolate.', places: ['Ragusa', 'Modica'] },
  { title: 'Villa Romana del Casale', text: 'Roman mosaics in Piazza Armerina on the way west.', places: ['Piazza Armerina'] },
  { title: 'Agrigento', text: 'Valley of the Temples at golden hour and the white cliffs of Scala dei Turchi.', places: ['Agrigento', 'Scala dei Turchi'] },
  { title: 'Palermo', text: 'Cathedral, Palatine Chapel, Ballarò market and street food.', places: ['Palermo'] },
  { title: 'Cefalù → Catania', text: 'Beach-side old town and Norman cathedral, then back east for the flight home.', places: ['Cefalù'] },
];

// Photo groups: Wikimedia Commons search terms and how many photos to show for each.
const PHOTO_PLACES = [
  { name: 'Catania', query: 'Catania', count: 14 },
  { name: 'Aci Trezza', query: 'Aci Trezza', count: 6 },
  { name: 'Etna', query: 'Etna', count: 10 },
  { name: 'Taormina', query: 'Taormina', count: 11 },
  { name: 'Siracusa', query: 'Siracusa Ortigia', fallback: 'Siracusa', count: 12 },
  { name: 'Noto', query: 'Noto', count: 8 },
  { name: 'Marzamemi', query: 'Marzamemi', count: 5 },
  { name: 'Ragusa', query: 'Ragusa Ibla', fallback: 'Ragusa', count: 8 },
  { name: 'Modica', query: 'Modica', count: 7 },
  { name: 'Piazza Armerina', query: 'Villa Romana del Casale', fallback: 'Piazza Armerina', count: 6 },
  { name: 'Agrigento', query: 'Valle dei Templi Agrigento', fallback: 'Agrigento', count: 10 },
  { name: 'Scala dei Turchi', query: 'Scala dei Turchi', count: 5 },
  { name: 'Palermo', query: 'Palermo', count: 12 },
  { name: 'Cefalù', query: 'Cefalù', count: 8 },
];

const WEATHER_CITIES = [
  { name: 'Catania', lat: 37.5079, lon: 15.083 },
  { name: 'Taormina', lat: 37.8516, lon: 15.2853 },
  { name: 'Siracusa', lat: 37.0755, lon: 15.2866 },
  { name: 'Ragusa', lat: 36.9269, lon: 14.7255 },
  { name: 'Agrigento', lat: 37.3111, lon: 13.5765 },
  { name: 'Palermo', lat: 38.1157, lon: 13.3615 },
  { name: 'Cefalù', lat: 38.0389, lon: 14.0225 },
];

/* ------------------------------------------------------------------
 * Helpers
 * ------------------------------------------------------------------ */
const $ = (id) => document.getElementById(id);
const pad = (n) => String(n).padStart(2, '0');

// Start of the trip in Sicilian time (CET, UTC+1, in November).
function tripStart(year) {
  return new Date(`${year}-11-14T00:00:00+01:00`);
}

function currentTrip(now = new Date()) {
  let start = tripStart(now.getFullYear());
  const end = new Date(start.getTime() + TRIP_LENGTH_DAYS * 86400000);
  if (now >= end) start = tripStart(now.getFullYear() + 1);
  return { start, end: new Date(start.getTime() + TRIP_LENGTH_DAYS * 86400000) };
}

function localISODate(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function addDays(d, n) {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
}

function escapeHTML(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function stripHTML(s) {
  const div = document.createElement('div');
  div.innerHTML = s || '';
  return (div.textContent || '').trim();
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/* ------------------------------------------------------------------
 * Countdown
 * ------------------------------------------------------------------ */
function startCountdown() {
  const { start, end } = currentTrip();
  $('countdown-label').textContent =
    `Departure on ${start.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Rome' })} (Sicily time)`;

  const tick = () => {
    const now = new Date();
    const diff = start - now;
    if (diff <= 0) {
      const day = Math.floor((now - start) / 86400000) + 1;
      $('countdown').hidden = true;
      $('arrived').hidden = false;
      $('arrived').textContent = now < end
        ? `Benvenuti in Sicilia! Day ${day} of ${TRIP_LENGTH_DAYS}: ${ITINERARY[day - 1].title}.`
        : 'Benvenuti in Sicilia!';
      return;
    }
    const s = Math.floor(diff / 1000);
    $('cd-days').textContent = Math.floor(s / 86400);
    $('cd-hours').textContent = pad(Math.floor((s % 86400) / 3600));
    $('cd-mins').textContent = pad(Math.floor((s % 3600) / 60));
    $('cd-secs').textContent = pad(s % 60);
  };
  tick();
  setInterval(tick, 1000);
}

/* ------------------------------------------------------------------
 * Weather (Open-Meteo, no API key needed)
 * ------------------------------------------------------------------ */
const WMO = {
  0: ['☀️', 'Clear sky'], 1: ['🌤️', 'Mainly clear'], 2: ['⛅', 'Partly cloudy'], 3: ['☁️', 'Overcast'],
  45: ['🌫️', 'Fog'], 48: ['🌫️', 'Rime fog'],
  51: ['🌦️', 'Light drizzle'], 53: ['🌦️', 'Drizzle'], 55: ['🌧️', 'Heavy drizzle'],
  56: ['🌧️', 'Freezing drizzle'], 57: ['🌧️', 'Freezing drizzle'],
  61: ['🌦️', 'Light rain'], 63: ['🌧️', 'Rain'], 65: ['🌧️', 'Heavy rain'],
  66: ['🌧️', 'Freezing rain'], 67: ['🌧️', 'Freezing rain'],
  71: ['🌨️', 'Light snow'], 73: ['🌨️', 'Snow'], 75: ['❄️', 'Heavy snow'], 77: ['🌨️', 'Snow grains'],
  80: ['🌦️', 'Rain showers'], 81: ['🌧️', 'Rain showers'], 82: ['⛈️', 'Violent showers'],
  85: ['🌨️', 'Snow showers'], 86: ['❄️', 'Snow showers'],
  95: ['⛈️', 'Thunderstorm'], 96: ['⛈️', 'Thunderstorm, hail'], 99: ['⛈️', 'Thunderstorm, hail'],
};

const weatherCache = new Map();

async function loadWeather(city) {
  const today = new Date();
  const startDate = localISODate(today);
  const endDate = localISODate(addDays(today, 9));
  const key = `${city.name}|${startDate}`;

  const range = `${today.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} – ${addDays(today, 9).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}`;
  $('weather-range').textContent = `${city.name}, ${range}`;

  document.querySelectorAll('#city-chips .chip').forEach((b) =>
    b.setAttribute('aria-selected', String(b.dataset.city === city.name)));

  const box = $('forecast');
  if (!weatherCache.has(key)) {
    box.innerHTML = '<p class="muted">Loading forecast…</p>';
    const url = new URL('https://api.open-meteo.com/v1/forecast');
    url.search = new URLSearchParams({
      latitude: city.lat,
      longitude: city.lon,
      daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,wind_speed_10m_max',
      timezone: 'Europe/Rome',
      start_date: startDate,
      end_date: endDate,
    });
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      weatherCache.set(key, await res.json());
    } catch (err) {
      box.innerHTML = `<p class="muted">Could not load the forecast (${escapeHTML(err.message)}). Please try again later.</p>`;
      return;
    }
  }
  renderWeather(weatherCache.get(key));
}

function renderWeather(data) {
  const d = data.daily;
  const { start } = currentTrip();
  const tripStartISO = `${start.getUTCFullYear()}-11-14`;
  const todayISO = localISODate(new Date());

  $('forecast').innerHTML = d.time.map((iso, i) => {
    const date = new Date(`${iso}T12:00:00`);
    const [icon, desc] = WMO[d.weather_code[i]] || ['🌡️', 'Unknown'];
    const tripDay = Math.round((new Date(`${iso}T12:00:00`) - new Date(`${tripStartISO}T12:00:00`)) / 86400000) + 1;
    const isTrip = tripDay >= 1 && tripDay <= TRIP_LENGTH_DAYS;
    const rainProb = d.precipitation_probability_max[i];
    return `
      <article class="day${iso === todayISO ? ' today' : ''}${isTrip ? ' trip' : ''}">
        ${isTrip ? `<span class="tag">Trip day ${tripDay}</span>` : ''}
        <div class="date">${iso === todayISO ? 'Today' : date.toLocaleDateString(undefined, { weekday: 'long' })}
          <small>${date.toLocaleDateString(undefined, { day: 'numeric', month: 'long' })}</small></div>
        <div class="icon" aria-hidden="true">${icon}</div>
        <div class="desc">${desc}</div>
        <div class="temps">${Math.round(d.temperature_2m_max[i])}° <span class="min">/ ${Math.round(d.temperature_2m_min[i])}°</span></div>
        <div class="meta">
          <span title="Chance of rain">💧 ${rainProb ?? '–'}%${d.precipitation_sum[i] ? ` · ${d.precipitation_sum[i]} mm` : ''}</span>
          <span title="Max wind">💨 ${Math.round(d.wind_speed_10m_max[i])} km/h</span>
        </div>
      </article>`;
  }).join('');
}

function initWeather() {
  const chips = $('city-chips');
  WEATHER_CITIES.forEach((city) => {
    const b = document.createElement('button');
    b.className = 'chip';
    b.textContent = city.name;
    b.dataset.city = city.name;
    b.setAttribute('role', 'tab');
    b.addEventListener('click', () => loadWeather(city));
    chips.appendChild(b);
  });
  loadWeather(WEATHER_CITIES[0]);
}

/* ------------------------------------------------------------------
 * Photo carousel (Wikimedia Commons API, CORS-enabled)
 * ------------------------------------------------------------------ */
const EXCLUDE = /\b(map|mappa|karte|carta|stemma|coat|wappen|flag|bandiera|logo|plan|pianta|diagram|scheme|locator|sign|cartolina|postcard|stamp|francobollo)\b/i;
const SLIDE_WIDTH = 1280; // standard Wikimedia thumbnail width
const THUMB_WIDTH = 250;

async function commonsSearch(search, limit) {
  const url = new URL('https://commons.wikimedia.org/w/api.php');
  url.search = new URLSearchParams({
    action: 'query',
    format: 'json',
    origin: '*',
    generator: 'search',
    gsrnamespace: '6',
    gsrsearch: search,
    gsrlimit: String(limit),
    prop: 'imageinfo',
    iiprop: 'url|size|mime|extmetadata',
    iiurlwidth: String(SLIDE_WIDTH),
    iiextmetadatafilter: 'Artist|LicenseShortName|ObjectName',
  });
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  const pages = Object.values(json.query?.pages || {});
  pages.sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
  return pages;
}

function toPhoto(page, place) {
  const info = page.imageinfo?.[0];
  if (!info || info.mime !== 'image/jpeg') return null;
  if (info.width < 1200 || info.width < info.height * 1.1) return null; // landscape, decent size
  if (EXCLUDE.test(page.title)) return null;
  const meta = info.extmetadata || {};
  const title = stripHTML(meta.ObjectName?.value) || page.title.replace(/^File:/, '').replace(/\.[a-z]+$/i, '').replace(/_/g, ' ');
  return {
    place,
    title,
    src: info.thumburl || info.url,
    thumb: (info.thumburl || info.url).replace(`/${SLIDE_WIDTH}px-`, `/${THUMB_WIDTH}px-`),
    page: info.descriptionurl,
    artist: stripHTML(meta.Artist?.value) || 'Unknown author',
    license: stripHTML(meta.LicenseShortName?.value) || '',
    key: page.title,
  };
}

async function photosFor(place, seen) {
  const out = [];
  const add = (pages) => {
    for (const p of pages) {
      if (out.length >= place.count) break;
      if (seen.has(p.title)) continue;
      const photo = toPhoto(p, place.name);
      if (photo) { seen.add(p.title); out.push(photo); }
    }
  };
  // Prefer Commons "Quality images", then widen the search if needed.
  const searches = [
    `${place.query} incategory:Quality_images filetype:bitmap`,
    `${place.query} incategory:Valued_images filetype:bitmap`,
    `intitle:"${place.query}" filetype:bitmap`,
  ];
  if (place.fallback) searches.push(`${place.fallback} incategory:Quality_images filetype:bitmap`, `intitle:"${place.fallback}" filetype:bitmap`);
  for (const s of searches) {
    if (out.length >= place.count) break;
    try { add(shuffle(await commonsSearch(s, 50))); } catch (e) { console.warn('Commons search failed', s, e); }
  }
  return out;
}

const carousel = { all: [], list: [], index: 0, timer: null, playing: true, filter: 'All' };

async function initCarousel() {
  const seen = new Set();
  const groups = await Promise.all(PHOTO_PLACES.map((p) => photosFor(p, seen)));
  carousel.all = groups.flat();

  if (!carousel.all.length) {
    $('photo-count').textContent = 'Photos could not be loaded right now. Please refresh the page.';
    $('spinner').classList.add('hidden');
    return;
  }

  $('photo-count').textContent = `${carousel.all.length} photos from ${groups.filter((g) => g.length).length} places on the route`;

  const chips = $('place-chips');
  ['All', ...PHOTO_PLACES.map((p) => p.name)].forEach((name, i) => {
    const n = name === 'All' ? carousel.all.length : carousel.all.filter((p) => p.place === name).length;
    if (!n) return;
    const b = document.createElement('button');
    b.className = 'chip';
    b.textContent = name === 'All' ? `All (${n})` : name;
    b.setAttribute('aria-pressed', String(i === 0));
    b.addEventListener('click', () => {
      chips.querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-pressed', 'false'));
      b.setAttribute('aria-pressed', 'true');
      setFilter(name);
    });
    chips.appendChild(b);
  });

  $('prev').addEventListener('click', () => { go(carousel.index - 1); restartTimer(); });
  $('next').addEventListener('click', () => { go(carousel.index + 1); restartTimer(); });
  $('play').addEventListener('click', togglePlay);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { go(carousel.index - 1); restartTimer(); }
    if (e.key === 'ArrowRight') { go(carousel.index + 1); restartTimer(); }
  });

  // Swipe on touch devices
  let touchX = null;
  $('stage').addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }, { passive: true });
  $('stage').addEventListener('touchend', (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 40) { go(carousel.index + (dx < 0 ? 1 : -1)); restartTimer(); }
    touchX = null;
  });

  setFilter('All');
}

function setFilter(name) {
  carousel.filter = name;
  carousel.list = name === 'All' ? carousel.all : carousel.all.filter((p) => p.place === name);
  renderThumbs();
  go(0);
  restartTimer();
}

function renderThumbs() {
  const box = $('thumbs');
  box.innerHTML = '';
  carousel.list.forEach((p, i) => {
    const b = document.createElement('button');
    b.setAttribute('aria-label', `${p.place}: ${p.title}`);
    b.innerHTML = `<img loading="lazy" src="${escapeHTML(p.thumb)}" alt="">`;
    b.addEventListener('click', () => { go(i); restartTimer(); });
    box.appendChild(b);
  });
}

function go(i) {
  const n = carousel.list.length;
  if (!n) return;
  carousel.index = ((i % n) + n) % n;
  const p = carousel.list[carousel.index];

  const img = $('slide-img');
  img.classList.remove('ready');
  $('spinner').classList.remove('hidden');
  img.onload = () => { img.classList.add('ready'); $('spinner').classList.add('hidden'); };
  img.onerror = () => { $('spinner').classList.add('hidden'); };
  img.src = p.src;
  img.alt = `${p.place}: ${p.title}`;

  $('slide-place').textContent = p.place;
  $('slide-title').textContent = p.title;
  $('slide-credit').innerHTML =
    `Photo: ${escapeHTML(p.artist)}${p.license ? ` · ${escapeHTML(p.license)}` : ''} · <a href="${escapeHTML(p.page)}" target="_blank" rel="noopener">Wikimedia Commons</a>`;
  $('counter').textContent = `${carousel.index + 1} / ${n}`;

  const thumbs = $('thumbs').children;
  Array.from(thumbs).forEach((t, k) => t.setAttribute('aria-current', String(k === carousel.index)));
  const current = thumbs[carousel.index];
  if (current) $('thumbs').scrollLeft = current.offsetLeft - $('thumbs').clientWidth / 2 + current.clientWidth / 2;

  // Preload the next slide
  const next = carousel.list[(carousel.index + 1) % n];
  if (next) new Image().src = next.src;
}

function restartTimer() {
  clearInterval(carousel.timer);
  if (carousel.playing) carousel.timer = setInterval(() => go(carousel.index + 1), 5000);
}

function togglePlay() {
  carousel.playing = !carousel.playing;
  $('play').textContent = carousel.playing ? '❚❚ Pause' : '▶ Play';
  $('play').setAttribute('aria-pressed', String(carousel.playing));
  restartTimer();
}

/* ------------------------------------------------------------------
 * Itinerary
 * ------------------------------------------------------------------ */
function renderItinerary() {
  const { start } = currentTrip();
  const startLocal = new Date(start.getUTCFullYear(), 10, 14); // calendar date, independent of the visitor's time zone
  $('itinerary').innerHTML = ITINERARY.map((day, i) => `
    <li>
      <div class="d">Day ${i + 1} · ${addDays(startLocal, i).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}</div>
      <h3>${escapeHTML(day.title)}</h3>
      <p>${escapeHTML(day.text)}</p>
    </li>`).join('');
}

startCountdown();
initWeather();
renderItinerary();
initCarousel();
