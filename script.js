// =========================================
// 1. GLOBALE VARIABLEN & CONFIG
// =========================================
const API_URL = "https://nightlife-backend-vijo.onrender.com/api"; // <-- HIER DEINEN RENDER-LINK EINTRAGEN FÜR GITHUB!
window.isAdminView = false;

// =========================================
// 2. FAB MENU & USER AUTH LOGIK
// =========================================
let loggedInUser = localStorage.getItem('site_user') || null;
let authMode = 'login';

window.updateFabUI = function() {
    const isFounder = !!sessionStorage.getItem('adminRole'); 
    const isUser = !!localStorage.getItem('site_user');      

    const btnTerminal = document.getElementById('fab-terminal');
    const btnDb = document.getElementById('fab-database');
    const btnEye = document.getElementById('fab-eye');
    
    if (btnTerminal) btnTerminal.style.display = isFounder ? 'flex' : 'none';
    if (btnDb) btnDb.style.display = isFounder ? 'flex' : 'none';
    if (btnEye) btnEye.style.display = isFounder ? 'flex' : 'none';

    if (isFounder || isUser) {
        document.getElementById('fab-icon').className = 'fas fa-plus';
    } else {
        document.getElementById('fab-icon').className = 'fas fa-user';
        const main = document.getElementById('fab-main');
        const actions = document.getElementById('fab-actions');
        if(main) main.classList.remove('active');
        if(actions) actions.classList.remove('active');
    }
};

window.handleFabClick = function() {
    const isFounder = !!sessionStorage.getItem('adminRole');
    const isUser = !!localStorage.getItem('site_user');

    if (!isFounder && !isUser) {
        const authModal = document.getElementById('auth-modal');
        if(authModal) {
            authModal.style.display = 'flex';
            document.getElementById('auth-user').value = '';
            document.getElementById('auth-pass').value = '';
        }
    } else {
        document.getElementById('fab-main').classList.toggle('active');
        document.getElementById('fab-actions').classList.toggle('active');
    }
};

window.switchAuthTab = function(mode) {
    authMode = mode;
    const btnLogin = document.getElementById('tab-login');
    const btnReg = document.getElementById('tab-register');
    const submitBtn = document.getElementById('auth-submit-btn');

    if(btnLogin && btnReg && submitBtn) {
        btnLogin.style.background = mode === 'login' ? 'var(--neon-blue)' : '#222';
        btnLogin.style.color = mode === 'login' ? '#000' : '#fff';
        btnReg.style.background = mode === 'register' ? 'var(--neon-blue)' : '#222';
        btnReg.style.color = mode === 'register' ? '#000' : '#fff';
        submitBtn.innerText = mode === 'login' ? 'Einloggen' : 'Registrieren';
    }
};

window.submitAuth = async function() {
    const user = document.getElementById('auth-user').value.trim();
    const pass = document.getElementById('auth-pass').value.trim();
    
    if (!user || !pass) { window.showToast("Bitte Username und Passwort eingeben!", "#ffaa00", "fas fa-exclamation-triangle"); return; }

    const btn = document.getElementById('auth-submit-btn');
    btn.disabled = true; btn.innerText = "LÄDT...";
    const endpoint = authMode === 'login' ? '/auth/login' : '/auth/register';

    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: user, password: pass })
        });
        const data = await response.json();

        if (data.success) {
            loggedInUser = user;
            localStorage.setItem('site_user', user); 
            document.getElementById('auth-modal').style.display = 'none';
            window.updateFabUI();
            window.showToast(`Willkommen, ${user}!`, "#00ffaa", "fas fa-user-check");
        } else { window.showToast(data.error || "Fehler!", "#ff3333", "fas fa-times"); }
    } catch (e) { window.showToast("Backend offline!", "#ff3333", "fas fa-server");
    } finally { btn.disabled = false; btn.innerText = authMode === 'login' ? 'Einloggen' : 'Registrieren'; }
};

window.logoutUser = function(event) {
    if(event) event.stopPropagation();
    loggedInUser = null;
    localStorage.removeItem('site_user');
    sessionStorage.removeItem('adminRole');
    sessionStorage.removeItem('adminName');
    sessionStorage.removeItem('adminKey');
    
    const adminDash = document.getElementById('admin-dashboard-view');
    const adminLog = document.getElementById('admin-login-view');
    if(adminDash && adminLog) { adminDash.style.display = 'none'; adminLog.style.display = 'block'; }
    
    window.updateFabUI();
    window.showToast("Erfolgreich abgemeldet.", "#ffaa00", "fas fa-sign-out-alt");
};

// =========================================
// 3. ADMIN & FOUNDER TERMINAL & TEAM LOGIK
// =========================================

window.applyAdminUI = function(role, name) {
    document.getElementById('admin-login-view').style.display = 'none';
    document.getElementById('admin-identity-view').style.display = 'none';
    document.getElementById('admin-dashboard-view').style.display = 'block';
    window.updateFabUI();
    
    const title = document.querySelector('#admin-dashboard-view h3');
    const teamTab = document.getElementById('team-tab-btn');

    if (role === 'founder') {
        title.innerText = `FOUNDER TERMINAL [${name.toUpperCase()}]`;
        title.style.color = 'var(--neon-gold)';
        title.style.textShadow = '0 0 15px var(--neon-gold)';
        if(teamTab) teamTab.style.display = 'inline-block'; // Nur Founder sehen das Team Panel
        window.loadAdminTeamList(); // Lädt die Passwörter
    } else {
        title.innerText = `ADMIN TERMINAL [${name.toUpperCase()}]`;
        title.style.color = 'var(--neon-blue)';
        title.style.textShadow = '0 0 15px var(--neon-blue)';
        if(teamTab) teamTab.style.display = 'none'; // Admins dürfen das nicht sehen!
    }
};

window.openAdminPanel = function() { 
    const modal = document.getElementById('admin-modal'); 
    if(modal) modal.style.display = 'flex'; 
    
    const savedRole = sessionStorage.getItem('adminRole');
    const savedName = sessionStorage.getItem('adminName');
    
    if(savedRole && savedName) {
        window.applyAdminUI(savedRole, savedName);
    } else {
        document.getElementById('admin-login-view').style.display = 'block'; 
        document.getElementById('admin-identity-view').style.display = 'none';
        document.getElementById('admin-dashboard-view').style.display = 'none'; 
        document.getElementById('admin-pw').value = ''; 
    }
};

window.checkAdminLogin = async function() {
    const pwInput = document.getElementById('admin-pw');
    const password = pwInput.value.trim();
    const loginBtn = document.querySelector('#admin-login-view button');

    if (!password) { window.showToast("Passwort eingeben!", "#ffaa00", "fas fa-exclamation-triangle"); return; }
    if(loginBtn) { loginBtn.innerText = "PRÜFT..."; loginBtn.disabled = true; }

    try {
        const response = await fetch(`${API_URL}/admin/login`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password })
        });
        const data = await response.json();

        if (data.success) {
            pwInput.value = ''; 
            
            if (data.role === 'founder_pending') {
                // Zeige den Can/Asta Auswahlbildschirm
                document.getElementById('admin-login-view').style.display = 'none';
                document.getElementById('admin-identity-view').style.display = 'block';
            } else {
                // Normaler Admin oder Master Admin loggt sich direkt ein
                sessionStorage.setItem('adminRole', 'admin');
                sessionStorage.setItem('adminName', data.name);
                window.applyAdminUI('admin', data.name);
                window.showToast(`Willkommen, ${data.name}!`, "var(--neon-blue)", "fas fa-unlock");
            }
        } else {
            window.showToast(data.error || "Falsches Passwort!", "#ff3333", "fas fa-lock");
        }
    } catch (err) { window.showToast("Backend offline!", "#ff3333", "fas fa-server");
    } finally { if(loginBtn) { loginBtn.innerText = "LOGIN"; loginBtn.disabled = false; } }
};

window.selectFounderIdentity = function(name) {
    sessionStorage.setItem('adminRole', 'founder');
    sessionStorage.setItem('adminName', name);
    window.applyAdminUI('founder', name);
    window.showToast(`God-Mode aktiviert, ${name}!`, "var(--neon-gold)", "fas fa-crown");
};

window.switchTerminalTab = function(tab) {
    document.querySelectorAll('.term-tab').forEach(t => {
        t.style.color = '#888';
        t.style.borderBottom = '2px solid transparent';
    });
    const activeTab = event.target;
    activeTab.style.color = '#fff';
    activeTab.style.borderBottom = '2px solid var(--neon-blue)';
    
    document.getElementById('term-content-events').style.display = tab === 'events' ? 'block' : 'none';
    document.getElementById('term-content-team').style.display = tab === 'team' ? 'block' : 'none';
};

// --- TEAM MANAGEMENT LOGIK ---

window.createTeamMember = async function() {
    const name = document.getElementById('new-team-name').value.trim();
    const role = document.getElementById('new-team-role').value;
    const password = document.getElementById('new-team-pw').value.trim();
    
    if(!name || !password) { window.showToast("Bitte Name und Passwort eingeben!", "#ffaa00"); return; }
    
    try {
        const response = await fetch(`${API_URL}/team`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, role, password })
        });
        const data = await response.json();
        if(data.success) {
            window.showToast("Teamler angelegt!", "#00ffaa");
            document.getElementById('new-team-name').value = '';
            document.getElementById('new-team-pw').value = '';
            window.loadAdminTeamList(); // Admin Liste updaten
            window.loadPublicTeam();    // Öffentliche Liste auf der Website updaten
        }
    } catch (e) { window.showToast("Fehler beim Anlegen!", "#ff3333"); }
};

window.loadAdminTeamList = async function() {
    try {
        const response = await fetch(`${API_URL}/team`);
        const data = await response.json();
        const list = document.getElementById('admin-team-list');
        list.innerHTML = '';
        
        if (data.data.length === 0) { list.innerHTML = '<p style="color:#555; font-size:0.8rem;">Keine dynamischen Accounts vorhanden.</p>'; return; }
        
        data.data.forEach(member => {
            list.innerHTML += `
                <div style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 5px; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <span style="color: var(--neon-blue); font-family: 'Orbitron'; font-size: 0.8rem; font-weight: bold;">${member.name}</span>
                        <span style="color: #aaa; font-size: 0.7rem; margin-left: 10px;">[${member.role}]</span>
                    </div>
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <span id="pw-${member.id}" style="color: #ffaa00; font-family: 'Poppins'; font-size: 0.8rem; display: none; background: #000; padding: 2px 5px; border-radius: 3px;">${member.password}</span>
                        <button onclick="document.getElementById('pw-${member.id}').style.display = document.getElementById('pw-${member.id}').style.display === 'none' ? 'inline' : 'none'" style="background: none; border: none; color: #888; cursor: pointer;" title="Passwort zeigen"><i class="fas fa-eye"></i></button>
                        <button onclick="deleteTeamMember('${member.id}')" style="background: none; border: none; color: #ff3333; cursor: pointer;" title="Löschen"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            `;
        });
    } catch (e) { console.error("Konnte Admin Teamliste nicht laden."); }
};

window.deleteTeamMember = async function(id) {
    if(!confirm("Diesen Account wirklich löschen? Er kann sich danach nicht mehr einloggen!")) return;
    try {
        await fetch(`${API_URL}/team/${id}`, { method: 'DELETE' });
        window.loadAdminTeamList();
        window.loadPublicTeam();
        window.showToast("Account gelöscht!", "#ff3333", "fas fa-trash");
    } catch (e) { window.showToast("Fehler beim Löschen!", "#ff3333"); }
};

window.loadPublicTeam = async function() {
    const teamBar = document.getElementById('team-bar-js');
    if(!teamBar) return;
    try {
        const response = await fetch(`${API_URL}/team`);
        const data = await response.json();
        teamBar.innerHTML = '';
        
        data.data.forEach(member => {
            let color = member.role === 'Admin' ? 'var(--neon-blue)' : (member.role === 'Mod' ? '#00ffaa' : 'var(--neon-purple)');
            
            // ULTRA KOMPAKT VERSION
            teamBar.innerHTML += `
                <div class="team-card scroll-visible" style="border: 1px solid ${color}; background: rgba(0,0,0,0.6); padding: 6px 15px; min-width: 110px; border-radius: 6px; box-shadow: 0 0 8px rgba(0,0,0,0.3); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px;">
                    <div class="role" style="color: ${color}; font-size: 0.6rem; letter-spacing: 0.5px; font-weight: bold; font-family: 'Orbitron';">${member.role.toUpperCase()}</div>
                    <div class="name" style="color: #fff; text-shadow: 0 0 5px ${color}; font-size: 0.9rem; font-family: 'Poppins'; font-weight: 600;">${member.name}</div>
                </div>
            `;
        });
    } catch (e) { 
        console.error("Konnte Teamliste nicht laden."); 
    }
};

// Lädt das Team auf der Website automatisch beim Start!
document.addEventListener('DOMContentLoaded', () => {
    window.updateFabUI();
    window.loadPublicTeam();
    window.loadEvents(); // <-- DAS HIER NEU HINZUFÜGEN!
    
    // ... restlicher Code ...
});

window.logoutAdmin = function() { window.logoutUser(); };

// =========================================
// 4. ALLGEMEINE UI FUNKTIONEN
// =========================================

window.showToast = function(message, color = 'var(--neon-purple)', icon = 'fas fa-bell') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'custom-toast';
    toast.style.borderColor = color;
    toast.innerHTML = `<i class="${icon}" style="color:${color}; font-size:1.2rem;"></i> <span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => { toast.style.animation = 'fadeOutRight 0.3s forwards'; setTimeout(() => toast.remove(), 300); }, 3000);
};

window.toggleImpressum = () => { const m = document.getElementById('impressum-modal'); if(m) m.style.display = (m.style.display === 'flex') ? 'none' : 'flex'; };
window.toggleRules = () => { const m = document.getElementById('rules-modal'); if(m) m.style.display = (m.style.display === 'flex') ? 'none' : 'flex'; };
window.showDailyToast = () => { window.showToast("Feature in Arbeit. Kommt noch!", "var(--neon-gold)", "fas fa-clock"); };

window.closeUniversalModal = function() { const m = document.getElementById('universal-modal'); if(m) m.style.display = 'none'; };

window.addEventListener('click', e => { 
    if (e.target.id === 'admin-modal') window.closeAdminPanel(); 
    if (e.target.id === 'universal-modal') window.closeUniversalModal(); 
    if (e.target.id === 'rules-modal') window.toggleRules(); 
    if (e.target.id === 'impressum-modal') window.toggleImpressum(); 
    if (e.target.id === 'inbox-modal') document.getElementById('inbox-modal').style.display='none';
    if (e.target.id === 'auth-modal') document.getElementById('auth-modal').style.display='none';
});

let currentActiveIndex = 1;
let autoScrollInterval = setInterval(() => { window.moveCarousel(1); }, 10000);
window.moveCarousel = function(direction) {
    clearInterval(autoScrollInterval); autoScrollInterval = setInterval(() => { window.moveCarousel(1); }, 10000);
    const cards = document.querySelectorAll('.event-card'); 
    if(!cards.length) return;
    let newActive = currentActiveIndex + direction; if (newActive > 2) newActive = 0; if (newActive < 0) newActive = 2;
    let prev = newActive - 1; if (prev < 0) prev = 2; let next = newActive + 1; if (next > 2) next = 0;
    cards.forEach(card => card.className = "event-card"); cards[newActive].classList.add('active'); cards[prev].classList.add('prev'); cards[next].classList.add('next'); currentActiveIndex = newActive;
};

// =========================================
// 5. INBOX & FORMULARE (TICKETS, UNBAN, ETC)
// =========================================
let currentFormType = '';
window.inboxData = []; 

window.openForm = function(type) {
    const isFounderOrAdmin = !!sessionStorage.getItem('adminRole');
    
    if (!loggedInUser && !isFounderOrAdmin) {
        const authModal = document.getElementById('auth-modal');
        if(authModal) authModal.style.display = 'flex';
        window.showToast("Bitte logge dich erst ein!", "var(--neon-blue)", "fas fa-lock");
        return;
    }
    
    currentFormType = type; 
    
    const title = document.getElementById('form-title');
    const userField = document.getElementById('form-username');
    const ticketSelect = document.getElementById('form-ticket-type');
    const fileArea = document.getElementById('file-upload-area');
    const fileInput = document.getElementById('form-file');
    const fileDesc = document.getElementById('file-upload-desc');
    
    if (type === 'unban') title.innerText = 'UNBAN ANTRAG';
    else if (type === 'vorschlag') title.innerText = 'SERVER VORSCHLAG';
    else if (type === 'ticket') title.innerText = 'SUPPORT TICKET';
    
    // Namensfeld steuern (Admins dürfen ändern, User nicht)
    if (isFounderOrAdmin) {
        userField.value = sessionStorage.getItem('adminName') || 'Admin';
        userField.disabled = false; 
    } else {
        userField.value = loggedInUser;
        userField.disabled = true; 
    }
    
    // Ticket Dropdown anzeigen/verstecken
    if (ticketSelect) ticketSelect.style.display = (type === 'ticket') ? 'block' : 'none';
    
    // Datei-Upload steuern
    if (fileInput) fileInput.value = ''; 
    if (type === 'vorschlag') {
        if (fileArea) fileArea.style.display = 'block';
        if (fileInput) fileInput.accept = 'image/jpeg, image/png, image/gif';
        if (fileDesc) fileDesc.innerText = 'Bild Upload (Max. 1MB)';
    } else if (type === 'ticket') {
        if (fileArea) fileArea.style.display = 'block';
        if (fileInput) fileInput.accept = 'image/jpeg, image/png, image/gif, video/mp4, video/quicktime';
        if (fileDesc) fileDesc.innerText = 'Media Upload (Bild/Video, Max. 1MB)';
    } else {
        if (fileArea) fileArea.style.display = 'none';
    }
    
    document.getElementById('form-text').value = '';
    document.getElementById('universal-modal').style.display = 'flex';
};

window.submitUniversalForm = async function() {
    const username = document.getElementById('form-username').value.trim();
    const text = document.getElementById('form-text').value.trim();
    const categoryEl = document.getElementById('form-ticket-type');
    const category = categoryEl ? categoryEl.value : null;
    const fileInput = document.getElementById('form-file');
    
    if (!username || !text) {
        window.showToast("Bitte Name und Nachricht ausfüllen!", "#ffaa00", "fas fa-exclamation-triangle");
        return;
    }
    
    const btn = document.getElementById('submit-universal-btn');
    btn.disabled = true; btn.innerText = "SENDET...";
    
    let fileBase64 = null;
    
    if (fileInput && fileInput.files.length > 0) {
        const file = fileInput.files[0];
        // 1MB Limit Prüfung
        if (file.size > 1048576) {
            window.showToast("Datei ist zu groß! (Max. 1MB)", "#ff3333", "fas fa-times");
            btn.disabled = false; btn.innerText = "ABSENDEN";
            return;
        }
        
        fileBase64 = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(file);
        });
    }
    
    const payload = {
        type: currentFormType,
        username: username,
        text: text,
        category: currentFormType === 'ticket' ? category : null,
        file: fileBase64
    };
    
    try {
        const response = await fetch(`${API_URL}/submissions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        
        if (data.success) {
            window.showToast("Erfolgreich gesendet!", "#00ffaa", "fas fa-check");
            document.getElementById('universal-modal').style.display = 'none';
        } else {
            window.showToast("Fehler beim Senden!", "#ff3333", "fas fa-times");
        }
    } catch (e) {
        window.showToast("Backend offline!", "#ff3333", "fas fa-server");
    } finally {
        btn.disabled = false; btn.innerText = "ABSENDEN";
    }
};

// ... (Die openForm und submitUniversalForm bleiben so wie sie vorher waren) ...

let currentInboxFilter = 'all';
let currentlyOpenTicketId = null;

window.filterInbox = function(filter) {
    currentInboxFilter = filter;
    
    // UI Tabs anpassen
    document.querySelectorAll('.inbox-tab').forEach(btn => btn.classList.remove('active'));
    document.getElementById('tab-' + filter).classList.add('active');
    
    // Liste neu rendern
    window.renderInboxList();
};

window.openInbox = async function() {
    document.getElementById('inbox-modal').style.display = 'flex';
    document.getElementById('inbox-list').innerHTML = `<p style="color: #aaa; text-align: center; margin-top: 20px;"><i class="fas fa-spinner fa-spin"></i> Lade Daten...</p>`;
    document.getElementById('inbox-detail').innerHTML = `<div style="flex: 1; display: flex; align-items: center; justify-content: center; color: #666; font-family: 'Orbitron';">Wähle einen Eintrag aus.</div>`;

    const adminRole = sessionStorage.getItem('adminRole');
    const user = localStorage.getItem('site_user');

    try {
        const response = await fetch(`${API_URL}/inbox`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role: adminRole, username: user })
        });
        const data = await response.json();
        
        if (data.success) {
            window.inboxData = data.data; 
            window.renderInboxList(); // Zeichnet die gefilterte Liste
        }
    } catch (e) {
        document.getElementById('inbox-list').innerHTML = `<p style="color: #ff3333; text-align: center; margin-top: 20px;">Verbindungsfehler.</p>`;
    }
};

window.renderInboxList = function() {
    const listElement = document.getElementById('inbox-list');
    listElement.innerHTML = '';
    
    // Filtern nach Kategorien
    let filteredData = window.inboxData.filter(item => {
        if (currentInboxFilter === 'closed') return item.status === 'closed';
        if (item.status === 'closed') return false; // Ausgeblendete verbergen, wenn nicht im "Erledigt" Tab
        
        if (currentInboxFilter === 'all') return true;
        return item.type === currentInboxFilter;
    });

    if (filteredData.length === 0) {
        listElement.innerHTML = `<p style="color: #666; text-align: center; margin-top: 20px; font-family: 'Poppins';">Keine Einträge gefunden.</p>`;
        return;
    }

    filteredData.forEach(item => {
        let color = item.status === 'closed' ? '#555' : (item.type === 'unban' ? '#ff3333' : (item.type === 'ticket' ? '#00ffaa' : 'var(--neon-purple)'));
        let icon = item.status === 'closed' ? 'fa-check-circle' : (item.type === 'unban' ? 'fa-ban' : (item.type === 'ticket' ? 'fa-ticket-alt' : 'fa-lightbulb'));
        
        // Finde den echten Index im Haupt-Array für die Detailansicht
        let realIndex = window.inboxData.findIndex(d => d.id === item.id);

        listElement.innerHTML += `
            <div onclick="showInboxDetail(${realIndex})" style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px; margin-bottom: 10px; cursor: pointer; border-left: 3px solid ${color}; transition: 0.3s;" onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='rgba(255,255,255,0.05)'">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                    <span style="color: ${color}; font-family: 'Orbitron'; font-size: 0.75rem; text-transform: uppercase;"><i class="fas ${icon}"></i> ${item.type}</span>
                    <span style="color: #666; font-size: 0.7rem;">${new Date(item.createdAt).toLocaleDateString()}</span>
                </div>
                <div style="color: ${item.status === 'closed' ? '#888' : '#fff'}; font-family: 'Poppins'; font-size: 0.9rem; font-weight: bold;">${item.username}</div>
            </div>
        `;
    });
};

window.showInboxDetail = function(index) {
    const item = window.inboxData[index];
    currentlyOpenTicketId = item.id;
    const detailElement = document.getElementById('inbox-detail');
    const isAdmin = !!sessionStorage.getItem('adminRole');
    
    let color = item.status === 'closed' ? '#555' : (item.type === 'unban' ? '#ff3333' : (item.type === 'ticket' ? '#00ffaa' : 'var(--neon-purple)'));
    let categoryHtml = item.category ? `<span style="background: rgba(0, 255, 170, 0.1); color: #00ffaa; padding: 3px 8px; border-radius: 4px; font-size: 0.7rem; margin-left: 10px; border: 1px solid rgba(0,255,170,0.3);">${item.category}</span>` : '';
    
    let mediaHtml = '';
    if (item.file) {
        if (item.file.startsWith('data:video')) mediaHtml = `<div style="margin-top: 15px;"><video src="${item.file}" controls style="max-width: 100%; max-height: 200px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);"></video></div>`;
        else if (item.file.startsWith('data:image')) mediaHtml = `<div style="margin-top: 15px;"><img src="${item.file}" style="max-width: 100%; max-height: 200px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);"></div>`;
    }

    // Chat Nachrichten rendern
    let chatHtml = `<div class="chat-area custom-scroll" style="flex: 1; overflow-y: auto; padding: 20px; background: #0f0f0f; display: flex; flex-direction: column; gap: 15px;">`;
    
    // Das erste Ticket-Feld als "erste Nachricht"
    chatHtml += `
        <div style="align-self: flex-start; background: rgba(255,255,255,0.05); padding: 15px; border-radius: 10px 10px 10px 0; max-width: 80%; border: 1px solid rgba(255,255,255,0.05);">
            <div style="font-size: 0.7rem; color: #888; font-family: 'Orbitron'; margin-bottom: 5px;">${item.username} (Ersteller)</div>
            <div style="color: #ccc; font-family: 'Poppins'; font-size: 0.9rem; line-height: 1.5; white-space: pre-wrap;">${item.text}</div>
            ${mediaHtml}
        </div>
    `;

    // Antworten aus dem Array
    if (item.messages) {
        item.messages.forEach(msg => {
            let isStaff = msg.role === 'founder' || msg.role === 'admin';
            let align = isStaff ? 'flex-end' : 'flex-start';
            let bg = isStaff ? 'rgba(0, 240, 255, 0.1)' : 'rgba(255,255,255,0.05)';
            let borderColor = isStaff ? 'var(--neon-blue)' : 'rgba(255,255,255,0.05)';
            let radius = isStaff ? '10px 10px 0 10px' : '10px 10px 10px 0';
            let nameColor = msg.role === 'founder' ? 'var(--neon-gold)' : (msg.role === 'admin' ? 'var(--neon-blue)' : '#888');

            chatHtml += `
                <div style="align-self: ${align}; background: ${bg}; padding: 12px 15px; border-radius: ${radius}; max-width: 80%; border: 1px solid ${borderColor};">
                    <div style="font-size: 0.7rem; color: ${nameColor}; font-family: 'Orbitron'; margin-bottom: 5px;">${msg.sender}</div>
                    <div style="color: #fff; font-family: 'Poppins'; font-size: 0.9rem; line-height: 1.5; white-space: pre-wrap;">${msg.text}</div>
                </div>
            `;
        });
    }
    chatHtml += `</div>`; // Chat Area End

    // Eingabefeld & Buttons (Nur wenn nicht geschlossen)
    let inputHtml = '';
    if (item.status !== 'closed') {
        inputHtml = `
            <div style="padding: 15px; background: #111; border-top: 1px solid rgba(255,255,255,0.1); display: flex; gap: 10px;">
                <input type="text" id="chat-input" placeholder="Schreibe eine Antwort..." style="flex: 1; background: #000; border: 1px solid #333; color: #fff; padding: 10px 15px; border-radius: 50px; outline: none; font-family: 'Poppins';">
                <button onclick="sendChatMessage(${index})" style="background: var(--neon-blue); color: #000; border: none; padding: 0 20px; border-radius: 50px; cursor: pointer; font-family: 'Orbitron'; font-weight: bold;"><i class="fas fa-paper-plane"></i></button>
                ${isAdmin ? `<button onclick="closeTicket(${index})" title="Als Erledigt markieren" style="background: #333; color: #ffaa00; border: 1px solid #ffaa00; padding: 0 15px; border-radius: 50px; cursor: pointer; transition: 0.3s;" onmouseover="this.style.background='#ffaa00'; this.style.color='#000'" onmouseout="this.style.background='#333'; this.style.color='#ffaa00'"><i class="fas fa-check"></i></button>` : ''}
            </div>
        `;
    } else {
        inputHtml = `<div style="padding: 15px; background: #111; border-top: 1px solid rgba(255,255,255,0.1); text-align: center; color: #666; font-family: 'Orbitron'; font-size: 0.8rem;">Dieses Ticket wurde geschlossen.</div>`;
    }

    detailElement.innerHTML = `
        <div style="padding: 20px; border-bottom: 1px solid rgba(255,255,255,0.1); background: rgba(0,0,0,0.5);">
            <div style="display: flex; align-items: center; margin-bottom: 5px;">
                <h3 style="font-family: 'Orbitron'; color: ${color}; text-transform: uppercase; margin: 0;">${item.type}</h3>
                ${categoryHtml}
            </div>
            <div style="color: #aaa; font-size: 0.75rem; font-family: 'Poppins';"><i class="fas fa-clock"></i> Erstellt: ${new Date(item.createdAt).toLocaleString()}</div>
        </div>
        ${chatHtml}
        ${inputHtml}
    `;
    
    // Nach unten scrollen im Chat
    setTimeout(() => {
        const chatArea = detailElement.querySelector('.chat-area');
        if(chatArea) chatArea.scrollTop = chatArea.scrollHeight;
    }, 50);
};

window.sendChatMessage = async function(index) {
    const item = window.inboxData[index];
    const inputField = document.getElementById('chat-input');
    const text = inputField.value.trim();
    if (!text) return;
    
    inputField.disabled = true;
    const senderName = sessionStorage.getItem('adminName') || loggedInUser || 'User';
    const role = sessionStorage.getItem('adminRole') || 'user';

    try {
        const response = await fetch(`${API_URL}/submissions/${item.id}/chat`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sender: senderName, text: text, role: role })
        });
        const data = await response.json();
        
        if (data.success) {
            // Lokal das Array updaten, damit wir nicht alles neu laden müssen
            if (!item.messages) item.messages = [];
            item.messages.push(data.message);
            window.showInboxDetail(index); // Chat direkt neu zeichnen
        }
    } catch (e) {
        window.showToast("Fehler beim Senden", "#ff3333", "fas fa-times");
    } finally {
        inputField.disabled = false;
        setTimeout(() => inputField.focus(), 50);
    }
};

window.closeTicket = async function(index) {
    const item = window.inboxData[index];
    if(!confirm("Ticket wirklich als erledigt markieren? (Wird in 7 Tagen gelöscht)")) return;

    try {
        const response = await fetch(`${API_URL}/submissions/${item.id}/close`, { method: 'POST' });
        const data = await response.json();
        
        if (data.success) {
            item.status = 'closed';
            item.closedAt = new Date().toISOString();
            window.showToast("Ticket geschlossen!", "#00ffaa", "fas fa-check");
            window.filterInbox(currentInboxFilter); // Liste aktualisieren
            document.getElementById('inbox-detail').innerHTML = `<div style="flex: 1; display: flex; align-items: center; justify-content: center; color: #666; font-family: 'Orbitron';">Wähle einen Eintrag aus.</div>`;
        }
    } catch (e) {
        window.showToast("Fehler beim Schließen", "#ff3333", "fas fa-times");
    }
};

// =========================================
// 6. INITIALISIERUNG BEIM LADEN (ANIMATIONEN)
// =========================================
document.addEventListener('DOMContentLoaded', () => {
    window.updateFabUI();

    const observer = new IntersectionObserver((entries) => { 
        entries.forEach(entry => { 
            if (entry.isIntersecting) { 
                entry.target.classList.add('scroll-visible'); 
                entry.target.classList.remove('scroll-hidden'); 
            } 
        }); 
    }, { threshold: 0.05 }); 
    document.querySelectorAll('.scroll-hidden').forEach((el) => observer.observe(el));

    const mobileMenu = document.getElementById('mobile-menu');
    const navLinks = document.getElementById('nav-links');
    if (mobileMenu && navLinks) {
        mobileMenu.addEventListener('click', () => navLinks.classList.toggle('active'));
        document.querySelectorAll('.nav-links a').forEach(item => { item.addEventListener('click', () => navLinks.classList.remove('active')); });
    }

    if (window.innerWidth > 768) {
        document.addEventListener('mousemove', (e) => {
            requestAnimationFrame(() => {
                const x = (e.clientX / window.innerWidth) - 0.5; const y = (e.clientY / window.innerHeight) - 0.5;
                const orb1 = document.querySelector('.orb-1'); const orb2 = document.querySelector('.orb-2');
                if(orb1 && orb2) { orb1.style.transform = `translate(${x*60}px, ${y*60}px)`; orb2.style.transform = `translate(${x*-60}px, ${y*-60}px)`; }
            });
        });
    }

    const particleContainer = document.querySelector('.particles');
    const dots = [];
    if(particleContainer) {
        for(let i=0; i<30; i++) {
            let container = document.createElement('div'); container.className = 'dot-container';
            container.style.top = Math.random() * 100 + 'vh'; container.style.left = Math.random() * 100 + 'vw';
            let dot = document.createElement('div'); dot.className = 'dot';
            if(Math.random() > 0.5) { dot.style.background = 'var(--neon-purple)'; dot.style.boxShadow = '0 0 10px var(--neon-purple)'; }
            dot.style.animationDelay = (Math.random() * 4) + 's';
            container.appendChild(dot); particleContainer.appendChild(container); dots.push(container);
        }
        
        document.addEventListener('mousemove', (e) => {
            dots.forEach(container => {
                const rect = container.getBoundingClientRect();
                const dx = e.clientX - (rect.left + rect.width/2);
                const dy = e.clientY - (rect.top + rect.height/2);
                const dist = Math.sqrt(dx*dx + dy*dy);
                
                if(dist < 120) {
                    const pushX = -(dx / dist) * 40;
                    const pushY = -(dy / dist) * 40;
                    container.style.transform = `translate(${pushX}px, ${pushY}px)`;
                } else {
                    container.style.transform = `translate(0px, 0px)`;
                }
            });
        });
    }
});

window.loadEvents = async function() {
    try {
        const response = await fetch(`${API_URL}/events`);
        const data = await response.json();
        
        if (data.success) {
            data.data.forEach(ev => {
                const titleEl = document.getElementById(`title-${ev.slot}`);
                const dateEl = document.getElementById(`date-${ev.slot}`);
                const badgeEl = document.getElementById(`badge-${ev.slot}`);
                
                if (titleEl) titleEl.innerText = ev.title;
                if (dateEl) dateEl.innerText = ev.date;
                
                // Timer Logik starten
                if (ev.time && ev.date) {
                    startTimer(ev.slot, `${ev.date} ${ev.time}`);
                }
            });
        }
    } catch (e) {
        console.error("Events konnten nicht geladen werden.");
    }
};

// Hilfsfunktion für den Countdown
function startTimer(slot, targetStr) {
    const timerEl = document.getElementById(`timer-${slot}`);
    if (!timerEl) return;

    function update() {
        // Umwandlung von DD.MM.YYYY HH:MM zu einem Datumsobjekt
        const parts = targetStr.split(/[\s.:]+/);
        const targetDate = new Date(parts[2], parts[1] - 1, parts[0], parts[3], parts[4]);
        const now = new Date();
        const diff = targetDate - now;

        if (diff <= 0) {
            timerEl.innerText = "JETZT LIVE";
            document.getElementById(`badge-${slot}`).innerText = "LIVE";
            document.getElementById(`badge-${slot}`).style.background = "red";
            return;
        }

        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        timerEl.innerText = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    
    update();
    setInterval(update, 1000);
}

// --- EVENT FUNKTIONEN ---
window.formatTime = function(input) {
    let val = input.value.replace(/\D/g, '');
    if (val.length > 2) val = val.substring(0, 2) + ':' + val.substring(2, 4);
    input.value = val;
};

window.formatDate = function(input) {
    let val = input.value.replace(/\D/g, '');
    if (val.length > 2) val = val.substring(0, 2) + '.' + val.substring(2);
    if (val.length > 5) val = val.substring(0, 5) + '.' + val.substring(5, 9);
    input.value = val;
};

window.updateMainEvent = async function() {
    const slot = document.getElementById('edit-ev-select').value;
    const title = document.getElementById('edit-ev-title').value.trim();
    const time = document.getElementById('edit-ev-time').value.trim();
    const date = document.getElementById('edit-ev-date').value.trim();

    if (!title || !time || !date) {
        window.showToast("Bitte alle Event-Felder ausfüllen!", "#ffaa00", "fas fa-exclamation-triangle");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/events/${slot}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, time, date })
        });
        const data = await response.json();
        
        if (data.success) {
            window.showToast("Event erfolgreich aktualisiert!", "#00ffaa", "fas fa-calendar-check");
            window.loadEvents();
            document.getElementById('edit-ev-title').value = '';
            document.getElementById('edit-ev-time').value = '';
            document.getElementById('edit-ev-date').value = '';
            // Falls du eine Lade-Funktion für die Slider hast, hier aufrufen:
            // window.loadEvents(); 
        } else {
            window.showToast("Fehler beim Speichern", "#ff3333", "fas fa-times");
        }
    } catch (e) {
        window.showToast("Backend offline!", "#ff3333", "fas fa-server");
    }
};
