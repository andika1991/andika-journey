// ===========================
// Strava Auto-Fetch with CORS Proxy
// ===========================
// 
// Solusi: Gunakan proxy untuk ambil data Strava dari browser
// Token tidak expired selama app aktif di Strava

const STRAVA_CONFIG = {
    athleteId: '151121389',
    // Masukkan Access Token Anda di sini
    // Dapatkan dari: https://www.strava.com/settings/api
    accessToken: 'f474894c011b734946af8b62cc81d776a094e652',
    
    // CORS Proxy (gratis, untuk bypass CORS)
    proxyUrl: 'https://corsproxy.io/?',
    
    // Strava API base
    stravaApi: 'https://www.strava.com/api/v3',
    
    // Cache
    cacheKey: 'strava_cache',
    cacheDuration: 10 * 60 * 1000 // 10 menit
};

// ===========================
// Fetch dengan Proxy
// ===========================
async function fetchStrava(endpoint) {
    // Cek cache
    const cached = getCache(endpoint);
    if (cached) return cached;

    const url = `${STRAVA_CONFIG.proxyUrl}${encodeURIComponent(STRAVA_CONFIG.stravaApi + endpoint)}`;
    
    try {
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${STRAVA_CONFIG.accessToken}`
            }
        });

        if (!response.ok) {
            throw new Error(`Strava API Error: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();
        setCache(endpoint, data);
        return data;
    } catch (error) {
        console.error('Strava fetch error:', error);
        return null;
    }
}

// ===========================
// Cache Functions
// ===========================
function getCache(key) {
    try {
        const raw = localStorage.getItem(STRAVA_CONFIG.cacheKey);
        if (!raw) return null;
        const cache = JSON.parse(raw);
        if (cache[key] && Date.now() - cache[key].timestamp < STRAVA_CONFIG.cacheDuration) {
            return cache[key].data;
        }
    } catch (e) {}
    return null;
}

function setCache(key, data) {
    try {
        const raw = localStorage.getItem(STRAVA_CONFIG.cacheKey);
        const cache = raw ? JSON.parse(raw) : {};
        cache[key] = { data, timestamp: Date.now() };
        localStorage.setItem(STRAVA_CONFIG.cacheKey, JSON.stringify(cache));
    } catch (e) {}
}

// ===========================
// Strava API Endpoints
// ===========================
const StravaAPI = {
    // Profil atlet
    async getAthlete() {
        return await fetchStrava('/athlete');
    },

    // Statistik atlet
    async getStats() {
        return await fetchStrava(`/athletes/${STRAVA_CONFIG.athleteId}/stats`);
    },

    // Aktivitas terbaru
    async getActivities(perPage = 10) {
        return await fetchStrava(`/athlete/activities?per_page=${perPage}`);
    },

    // Detail aktivitas
    async getActivity(id) {
        return await fetchStrava(`/activities/${id}`);
    }
};

// ===========================
// Render Data
// ===========================
async function loadStravaData() {
    // Cek token
    if (STRAVA_CONFIG.accessToken === 'PASTE_TOKEN_DISINI') {
        showSetupGuide();
        return;
    }

    showLoading();

    // Load paralel
    const [athlete, stats, activities] = await Promise.all([
        StravaAPI.getAthlete(),
        StravaAPI.getStats(),
        StravaAPI.getActivities(8)
    ]);

    if (athlete) renderAthlete(athlete);
    if (stats) renderStats(stats);
    if (activities && activities.length > 0) {
        renderActivities(activities);
        renderSummary(activities);
    } else {
        showError('Tidak dapat memuat aktivitas. Periksa token Anda.');
    }
}

// ===========================
// Show Setup Guide
// ===========================
function showSetupGuide() {
    const containers = ['strava-profile', 'strava-stats', 'strava-activities', 'strava-summary'];
    
    containers.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.innerHTML = `
                <div class="setup-card">
                    <div class="setup-icon">🔗</div>
                    <h4>Hubungkan Strava</h4>
                    <div class="setup-steps">
                        <div class="setup-step">
                            <span class="step-num">1</span>
                            <span>Buka <a href="https://www.strava.com/settings/api" target="_blank">strava.com/settings/api</a></span>
                        </div>
                        <div class="setup-step">
                            <span class="step-num">2</span>
                            <span>Klik "Create & Manage Your App"</span>
                        </div>
                        <div class="setup-step">
                            <span class="step-num">3</span>
                            <span>Copy <strong>Access Token</strong></span>
                        </div>
                        <div class="setup-step">
                            <span class="step-num">4</span>
                            <span>Edit <code>strava.js</code> → paste token</span>
                        </div>
                    </div>
                </div>
            `;
        }
    });
}

// ===========================
// Show Loading
// ===========================
function showLoading() {
    const containers = ['strava-profile', 'strava-stats', 'strava-activities', 'strava-summary'];
    containers.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = '<div class="loading">Memuat data Strava... ⏳</div>';
    });
}

// ===========================
// Show Error
// ===========================
function showError(msg) {
    const el = document.getElementById('strava-activities');
    if (el) el.innerHTML = `<div class="error-msg">⚠️ ${msg}</div>`;
}

// ===========================
// Render Athlete
// ===========================
function renderAthlete(athlete) {
    const el = document.getElementById('strava-profile');
    if (!el) return;

    el.innerHTML = `
        <div class="strava-athlete">
            <img src="${athlete.profile}" alt="${athlete.firstname}" class="athlete-photo">
            <div class="athlete-info">
                <h4>${athlete.firstname} ${athlete.lastname}</h4>
                <p>${athlete.city || ''}, ${athlete.country || 'Indonesia'}</p>
                <div class="athlete-meta">
                    <span>🚴 ${athlete.follower_count || 0} followers</span>
                    <span>👥 ${athlete.friend_count || 0} following</span>
                </div>
            </div>
            <a href="https://www.strava.com/athletes/${athlete.id}" target="_blank" class="btn-strava">
                Follow →
            </a>
        </div>
    `;
}

// ===========================
// Render Stats
// ===========================
function renderStats(stats) {
    const el = document.getElementById('strava-stats');
    if (!el) return;

    const ytd = stats.ytd_run_totals || {};
    const recent = stats.recent_run_totals || {};
    const all = stats.all_run_totals || {};

    el.innerHTML = `
        <div class="strava-stats-grid">
            <div class="strava-stat-card">
                <span class="ss-label">All Time</span>
                <span class="ss-value">${Math.round((all.distance || 0) / 1000).toLocaleString()}</span>
                <span class="ss-unit">KM</span>
            </div>
            <div class="strava-stat-card">
                <span class="ss-label">Tahun Ini</span>
                <span class="ss-value">${Math.round((ytd.distance || 0) / 1000)}</span>
                <span class="ss-unit">KM</span>
            </div>
            <div class="strava-stat-card">
                <span class="ss-label">4 Minggu</span>
                <span class="ss-value">${Math.round((recent.distance || 0) / 1000)}</span>
                <span class="ss-unit">KM</span>
            </div>
            <div class="strava-stat-card">
                <span class="ss-label">Elevation</span>
                <span class="ss-value">${Math.round((ytd.elevation_gain || 0)).toLocaleString()}</span>
                <span class="ss-unit">m</span>
            </div>
        </div>
    `;

    // Update hero stats
    updateHeroStats(all);
}

// ===========================
// Update Hero Stats
// ===========================
function updateHeroStats(allStats) {
    const totalKm = Math.round((allStats.distance || 0) / 1000);
    const totalActivities = allStats.count || 0;
    
    const statEls = document.querySelectorAll('.hs-val');
    if (statEls.length >= 2) {
        statEls[0].textContent = totalKm.toLocaleString();
        statEls[1].textContent = totalActivities.toLocaleString();
    }
}

// ===========================
// Render Activities
// ===========================
function renderActivities(activities) {
    const el = document.getElementById('strava-activities');
    if (!el) return;

    const html = activities.map(activity => {
        const distance = (activity.distance / 1000).toFixed(1);
        const pace = calcPace(activity.distance, activity.moving_time);
        const date = new Date(activity.start_date).toLocaleDateString('id-ID', {
            weekday: 'short', day: 'numeric', month: 'short'
        });
        const time = formatTime(activity.moving_time);
        const icon = getActivityIcon(activity.type);

        return `
            <div class="activity-row">
                <div class="activity-icon">${icon}</div>
                <div class="activity-info">
                    <h5>${activity.name}</h5>
                    <span class="activity-date">${date}</span>
                </div>
                <div class="activity-stats">
                    <span class="activity-distance">${distance} km</span>
                    <span class="activity-pace">${pace}/km</span>
                    <span class="activity-time">${time}</span>
                </div>
                <a href="https://www.strava.com/activities/${activity.id}" target="_blank" class="activity-link">↗</a>
            </div>
        `;
    }).join('');

    el.innerHTML = `
        <div class="strava-activities-list">
            <div class="activities-header">
                <h4>🏃 Aktivitas Terbaru</h4>
                <a href="https://www.strava.com/athletes/${STRAVA_CONFIG.athleteId}" target="_blank" class="see-all">Lihat Semua →</a>
            </div>
            ${html}
        </div>
    `;
}

// ===========================
// Render Summary
// ===========================
function renderSummary(activities) {
    const el = document.getElementById('strava-summary');
    if (!el) return;

    const totalDist = activities.reduce((s, a) => s + (a.distance || 0), 0);
    const totalTime = activities.reduce((s, a) => s + (a.moving_time || 0), 0);
    const totalElev = activities.reduce((s, a) => s + (a.total_elevation_gain || 0), 0);
    const avgPace = calcPace(totalDist, totalTime);

    el.innerHTML = `
        <div class="summary-cards">
            <div class="summary-card">
                <span class="sc-icon">📏</span>
                <span class="sc-value">${(totalDist / 1000).toFixed(1)}</span>
                <span class="sc-unit">KM (${activities.length} runs)</span>
            </div>
            <div class="summary-card">
                <span class="sc-icon">⏱️</span>
                <span class="sc-value">${formatTime(totalTime)}</span>
                <span class="sc-unit">Total Time</span>
            </div>
            <div class="summary-card">
                <span class="sc-icon">📈</span>
                <span class="sc-value">${Math.round(totalElev)}</span>
                <span class="sc-unit">m Elevation</span>
            </div>
            <div class="summary-card">
                <span class="sc-icon">⚡</span>
                <span class="sc-value">${avgPace}</span>
                <span class="sc-unit">Avg Pace</span>
            </div>
        </div>
    `;
}

// ===========================
// Helper Functions
// ===========================
function calcPace(distM, timeS) {
    if (!distM || distM === 0) return '--:--';
    const pace = timeS / (distM / 1000);
    const m = Math.floor(pace / 60);
    const s = Math.round(pace % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
}

function formatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.round(seconds % 60);
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${m}:${String(s).padStart(2, '0')}`;
}

function getActivityIcon(type) {
    const icons = { Run: '🏃', TrailRun: '⛰️', Walk: '🚶', Ride: '🚴', Swim: '🏊' };
    return icons[type] || '🏃';
}

// ===========================
// Init
// ===========================
document.addEventListener('DOMContentLoaded', loadStravaData);
