// ===========================
// Strava API Integration
// ===========================
// 
// CARA SETUP:
// 1. Buka https://www.strava.com/settings/api
// 2. Buat aplikasi baru (Application Name: "Andika Run Portfolio")
// 3. Copy Client ID dan Client Secret
// 4. Dapatkan Access Token melalui OAuth flow
// 5. Masukkan token di bawah ini
//
// Atau gunakan Personal Access Token dari:
// https://www.strava.com/settings/api

const STRAVA_CONFIG = {
    // Ganti dengan token Anda
    accessToken: 'f474894c011b734946af8b62cc81d776a094e652',
    
    // Ganti dengan athlete ID Anda
    athleteId: '151121389',
    
    // Base URL
    baseUrl: 'https://www.strava.com/api/v3',
    
    // Cache duration (5 menit)
    cacheDuration: 5 * 60 * 1000
};

// ===========================
// Strava API Client
// ===========================
class StravaClient {
    constructor(config) {
        this.config = config;
        this.cache = new Map();
    }

    async fetch(endpoint, params = {}) {
        const cacheKey = `${endpoint}_${JSON.stringify(params)}`;
        const cached = this.cache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < this.config.cacheDuration) {
            return cached.data;
        }

        try {
            const url = new URL(`${this.config.baseUrl}${endpoint}`);
            Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

            const response = await fetch(url.toString(), {
                headers: {
                    'Authorization': `Bearer ${this.config.accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Strava API Error: ${response.status}`);
            }

            const data = await response.json();
            this.cache.set(cacheKey, { data, timestamp: Date.now() });
            return data;
        } catch (error) {
            console.error('Strava fetch error:', error);
            return null;
        }
    }

    // ===========================
    // Athlete Profile
    // ===========================
    async getAthlete() {
        return await this.fetch('/athlete');
    }

    // ===========================
    // Athlete Stats
    // ===========================
    async getStats() {
        return await this.fetch(`/athletes/${this.config.athleteId}/stats`);
    }

    // ===========================
    // Recent Activities
    // ===========================
    async getRecentActivities(perPage = 10) {
        return await this.fetch('/athlete/activities', { per_page: perPage });
    }

    // ===========================
    // Activity Details
    // ===========================
    async getActivity(id) {
        return await this.fetch(`/activities/${id}`);
    }

    // ===========================
    // Kudos on Activity
    // ===========================
    async getKudos(activityId) {
        return await this.fetch(`/activities/${activityId}/kudos`);
    }
}

// ===========================
// Initialize Strava Client
// ===========================
const strava = new StravaClient(STRAVA_CONFIG);

// ===========================
// Render Functions
// ===========================
async function loadStravaData() {
    // Cek apakah token sudah diisi
    if (STRAVA_CONFIG.accessToken === 'PASTE_STRAVA_TOKEN_DISINI') {
        showStravaSetup();
        return;
    }

    // Load data secara paralel
    const [athlete, stats, activities] = await Promise.all([
        strava.getAthlete(),
        strava.getStats(),
        strava.getRecentActivities(10)
    ]);

    if (athlete) renderAthleteProfile(athlete);
    if (stats) renderStats(stats);
    if (activities) {
        renderRecentActivities(activities);
        renderActivitySummary(activities);
    }
}

// ===========================
// Show Setup Instructions
// ===========================
function showStravaSetup() {
    const containers = [
        document.getElementById('strava-profile'),
        document.getElementById('strava-stats'),
        document.getElementById('strava-activities')
    ];

    containers.forEach(container => {
        if (container) {
            container.innerHTML = `
                <div class="strava-setup">
                    <div class="setup-icon">🔗</div>
                    <h4>Hubungkan Strava</h4>
                    <p>Untuk menampilkan data otomatis dari Strava:</p>
                    <ol>
                        <li>Buka <a href="https://www.strava.com/settings/api" target="_blank">Strava API Settings</a></li>
                        <li>Buat aplikasi baru</li>
                        <li>Copy Access Token</li>
                        <li>Edit file <code>strava.js</code> dan paste token</li>
                    </ol>
                </div>
            `;
        }
    });
}

// ===========================
// Render Athlete Profile
// ===========================
function renderAthleteProfile(athlete) {
    const container = document.getElementById('strava-profile');
    if (!container) return;

    container.innerHTML = `
        <div class="strava-athlete">
            <img src="${athlete.profile}" alt="${athlete.firstname}" class="athlete-photo">
            <div class="athlete-info">
                <h4>${athlete.firstname} ${athlete.lastname}</h4>
                <p>${athlete.city || ''}, ${athlete.country || ''}</p>
                <div class="athlete-meta">
                    <span>🚴 ${athlete.follower_count || 0} followers</span>
                    <span>👥 ${athlete.friend_count || 0} following</span>
                </div>
            </div>
            <a href="https://www.strava.com/athletes/${athlete.id}" target="_blank" class="btn-strava">
                Lihat di Strava →
            </a>
        </div>
    `;
}

// ===========================
// Render Stats
// ===========================
function renderStats(stats) {
    // Update hero stats dengan data Strava
    const totalKm = Math.round((stats.all_run_totals?.distance || 0) / 1000);
    const totalActivities = stats.all_run_totals?.count || 0;
    const totalRuns = stats.all_run_totals?.count || 0;

    // Update elemen yang ada
    const statElements = document.querySelectorAll('.hs-val');
    if (statElements.length >= 2) {
        statElements[0].textContent = totalKm.toLocaleString();
        statElements[1].textContent = totalActivities.toLocaleString();
    }

    // Render recent stats
    const container = document.getElementById('strava-stats');
    if (!container) return;

    const recentRuns = stats.recent_run_totals || {};
    const ytdRuns = stats.ytd_run_totals || {};

    container.innerHTML = `
        <div class="strava-stats-grid">
            <div class="strava-stat-card">
                <span class="ss-label">Tahun Ini</span>
                <span class="ss-value">${Math.round((ytdRuns.distance || 0) / 1000)}</span>
                <span class="ss-unit">KM</span>
            </div>
            <div class="strava-stat-card">
                <span class="ss-label">Activities</span>
                <span class="ss-value">${ytdRuns.count || 0}</span>
                <span class="ss-unit">runs</span>
            </div>
            <div class="strava-stat-card">
                <span class="ss-label">4 Minggu Terakhir</span>
                <span class="ss-value">${Math.round((recentRuns.distance || 0) / 1000)}</span>
                <span class="ss-unit">KM</span>
            </div>
            <div class="strava-stat-card">
                <span class="ss-label">Elevation</span>
                <span class="ss-value">${Math.round((ytdRuns.elevation_gain || 0))}</span>
                <span class="ss-unit">m gain</span>
            </div>
        </div>
    `;
}

// ===========================
// Render Recent Activities
// ===========================
function renderRecentActivities(activities) {
    const container = document.getElementById('strava-activities');
    if (!container) return;

    if (!activities || activities.length === 0) {
        container.innerHTML = '<p class="no-data">Belum ada aktivitas.</p>';
        return;
    }

    const html = activities.map(activity => {
        const distance = (activity.distance / 1000).toFixed(1);
        const pace = calculatePace(activity.distance, activity.moving_time);
        const date = new Date(activity.start_date).toLocaleDateString('id-ID', {
            day: 'numeric', month: 'short', year: 'numeric'
        });
        const time = formatTime(activity.moving_time);

        return `
            <div class="activity-row">
                <div class="activity-icon">${getActivityIcon(activity.type)}</div>
                <div class="activity-info">
                    <h5>${activity.name}</h5>
                    <span class="activity-date">${date}</span>
                </div>
                <div class="activity-stats">
                    <span class="activity-distance">${distance} km</span>
                    <span class="activity-pace">${pace} /km</span>
                    <span class="activity-time">${time}</span>
                </div>
                <a href="https://www.strava.com/activities/${activity.id}" target="_blank" class="activity-link">→</a>
            </div>
        `;
    }).join('');

    container.innerHTML = `
        <div class="strava-activities-list">
            <h4>🏃 Aktivitas Terbaru</h4>
            ${html}
            <a href="https://www.strava.com/athletes/${STRAVA_CONFIG.athleteId}" target="_blank" class="btn-strava">
                Lihat Semua di Strava →
            </a>
        </div>
    `;
}

// ===========================
// Render Activity Summary
// ===========================
function renderActivitySummary(activities) {
    const container = document.getElementById('strava-summary');
    if (!container || !activities || activities.length === 0) return;

    const totalDist = activities.reduce((sum, a) => sum + (a.distance || 0), 0);
    const totalTime = activities.reduce((sum, a) => sum + (a.moving_time || 0), 0);
    const totalElev = activities.reduce((sum, a) => sum + (a.total_elevation_gain || 0), 0);
    const avgPace = calculatePace(totalDist, totalTime);

    container.innerHTML = `
        <div class="summary-cards">
            <div class="summary-card">
                <span class="sc-icon">📏</span>
                <span class="sc-value">${(totalDist / 1000).toFixed(1)}</span>
                <span class="sc-unit">KM Total</span>
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
function calculatePace(distanceMeters, timeSeconds) {
    if (!distanceMeters || distanceMeters === 0) return '--:--';
    const paceSeconds = timeSeconds / (distanceMeters / 1000);
    const minutes = Math.floor(paceSeconds / 60);
    const seconds = Math.round(paceSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function formatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.round(seconds % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
}

function getActivityIcon(type) {
    const icons = {
        'Run': '🏃',
        'TrailRun': '⛰️',
        'Walk': '🚶',
        'Ride': '🚴',
        'Swim': '🏊',
        'Hike': '🥾'
    };
    return icons[type] || '🏃';
}

// ===========================
// Initialize on Load
// ===========================
document.addEventListener('DOMContentLoaded', () => {
    loadStravaData();
});
