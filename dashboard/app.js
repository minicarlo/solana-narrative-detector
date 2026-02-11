// Solana Narrative Detector Dashboard
// Fetches and displays narrative data from the detection pipeline

const CONFIG = {
    DATA_URL: '../data/narratives.json',
    REFRESH_INTERVAL: 5 * 60 * 1000, // 5 minutes
};

let narrativesData = null;

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    setupEventListeners();
    
    // Auto-refresh every 5 minutes
    setInterval(loadData, CONFIG.REFRESH_INTERVAL);
});

function setupEventListeners() {
    // Modal close button
    document.querySelector('.close').addEventListener('click', closeModal);
    
    // Close modal on outside click
    window.addEventListener('click', (e) => {
        const modal = document.getElementById('detailModal');
        if (e.target === modal) {
            closeModal();
        }
    });
}

async function loadData() {
    try {
        updateRefreshIndicator(true);
        
        const response = await fetch(CONFIG.DATA_URL + '?t=' + Date.now());
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        narrativesData = await response.json();
        renderDashboard(narrativesData);
        
        updateLastRefresh();
    } catch (error) {
        console.error('Failed to load data:', error);
        showError('Failed to load narrative data. Retrying...');
    } finally {
        updateRefreshIndicator(false);
    }
}

function renderDashboard(data) {
    if (!data || !data.narratives) {
        showError('No data available');
        return;
    }
    
    // Update stats
    updateStats(data);
    
    // Sort narratives by confidence (highest first)
    const sortedNarratives = [...data.narratives].sort((a, b) => 
        b.confidence - a.confidence
    );
    
    // Render narrative cards
    const grid = document.getElementById('narrativesGrid');
    grid.innerHTML = sortedNarratives.map(narrative => createNarrativeCard(narrative)).join('');
    
    // Add click handlers
    document.querySelectorAll('.narrative-card').forEach((card, index) => {
        card.addEventListener('click', () => showNarrativeDetail(sortedNarratives[index]));
    });
}

function updateStats(data) {
    const narratives = data.narratives || [];
    
    // Active narratives count
    document.getElementById('activeNarratives').textContent = narratives.length;
    
    // Average confidence
    const avgConfidence = narratives.length > 0
        ? Math.round(narratives.reduce((sum, n) => sum + n.confidence, 0) / narratives.length)
        : 0;
    document.getElementById('avgConfidence').textContent = avgConfidence + '%';
    
    // Total project ideas
    const totalIdeas = narratives.reduce((sum, n) => sum + (n.projectIdeas?.length || 0), 0);
    document.getElementById('projectIdeas').textContent = totalIdeas;
}

function createNarrativeCard(narrative) {
    const confidencePercent = Math.round(narrative.confidence * 100);
    const topProjects = narrative.topProjects?.slice(0, 3) || [];
    const keywords = narrative.trendingKeywords?.slice(0, 5) || [];
    const ideasCount = narrative.projectIdeas?.length || 0;
    
    return `
        <div class="narrative-card" data-id="${narrative.id}">
            <div class="card-header">
                <h3 class="narrative-name">${escapeHtml(narrative.name)}</h3>
                <span class="confidence-badge">${confidencePercent}%</span>
            </div>
            
            <div class="confidence-bar">
                <div class="confidence-fill" style="width: ${confidencePercent}%"></div>
            </div>
            
            <div class="section">
                <div class="section-title">Trending Keywords</div>
                <div class="keywords">
                    ${keywords.map(kw => `<span class="keyword">${escapeHtml(kw)}</span>`).join('')}
                </div>
            </div>
            
            <div class="section">
                <div class="section-title">Top Projects</div>
                <ul class="top-projects">
                    ${topProjects.map(p => `<li>${escapeHtml(p.name || p)}</li>`).join('')}
                    ${topProjects.length === 0 ? '<li style="opacity: 0.5;">No projects detected yet</li>' : ''}
                </ul>
            </div>
            
            <div class="project-ideas-preview">
                <strong>${ideasCount}</strong> project ideas generated
            </div>
        </div>
    `;
}

function showNarrativeDetail(narrative) {
    const modal = document.getElementById('detailModal');
    const modalBody = document.getElementById('modalBody');
    
    const confidencePercent = Math.round(narrative.confidence * 100);
    const keywords = narrative.trendingKeywords || [];
    const projects = narrative.topProjects || [];
    const ideas = narrative.projectIdeas || [];
    const dataSources = narrative.dataSources || {};
    
    modalBody.innerHTML = `
        <h2>${escapeHtml(narrative.name)}</h2>
        
        <div class="detail-section">
            <h3>Confidence Score</h3>
            <div class="confidence-bar" style="margin: 1rem 0;">
                <div class="confidence-fill" style="width: ${confidencePercent}%"></div>
            </div>
            <p>${confidencePercent}% confidence based on signal strength</p>
        </div>
        
        <div class="detail-section">
            <h3>Data Sources</h3>
            <ul class="source-list">
                <li>🔵 Helius (On-chain): ${dataSources.helius || 0} signals</li>
                <li>🟣 GitHub: ${dataSources.github || 0} repos</li>
                <li>🟢 Social: ${dataSources.social || 0} mentions</li>
            </ul>
        </div>
        
        <div class="detail-section">
            <h3>All Trending Keywords</h3>
            <div class="keywords">
                ${keywords.map(kw => `<span class="keyword">${escapeHtml(kw)}</span>`).join('')}
            </div>
        </div>
        
        <div class="detail-section">
            <h3>Top Projects</h3>
            <ul class="top-projects">
                ${projects.map(p => `
                    <li>
                        <strong>${escapeHtml(p.name || p)}</strong>
                        ${p.description ? `<br><small>${escapeHtml(p.description.substring(0, 100))}...</small>` : ''}
                    </li>
                `).join('')}
            </ul>
        </div>
        
        <div class="detail-section">
            <h3>Generated Project Ideas</h3>
            <ul class="ideas-list">
                ${ideas.map(idea => `<li>${escapeHtml(idea)}</li>`).join('')}
            </ul>
        </div>
    `;
    
    modal.style.display = 'block';
}

function closeModal() {
    document.getElementById('detailModal').style.display = 'none';
}

function updateLastRefresh() {
    const now = new Date();
    document.getElementById('lastUpdate').textContent = now.toLocaleTimeString();
}

function updateRefreshIndicator(loading) {
    const indicator = document.getElementById('refreshIndicator');
    indicator.style.animation = loading ? 'pulse 1s infinite' : 'pulse 2s infinite';
    indicator.style.color = loading ? 'var(--solana-purple)' : 'var(--solana-green)';
}

function showError(message) {
    const grid = document.getElementById('narrativesGrid');
    grid.innerHTML = `
        <div class="error-message" style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
            <p style="color: var(--danger);">${escapeHtml(message)}</p>
            <button onclick="loadData()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: var(--solana-purple); color: white; border: none; border-radius: 4px; cursor: pointer;">Retry</button>
        </div>
    `;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
