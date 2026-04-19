let stafi = JSON.parse(localStorage.getItem('stafi')) || [];
let editIndex = -1;

const rolet = {
    superadmin: 'Super Admin',
    management: 'Management',
    dep_management: 'Dep. Management',
    staff_hq: 'Staff HQ',
    staff: 'Staff'
};

const deget = ['HQ', 'Prishtinë', 'Prizren', 'Ferizaj', 'Pejë', 'Gjilan', 'Gjakovë', 'Mitrovicë'];

function ruajNeStorage() {
    localStorage.setItem('stafi', JSON.stringify(stafi));
}

function shtoStaf() {
    const user = JSON.parse(localStorage.getItem('user_aktual'));
    if (!user || user.role !== 'superadmin') { alert('Nuk keni qasje!'); return; }
    editIndex = -1;
    document.getElementById('modal-title').innerHTML = 'Shto <span style="font-weight:500">Anëtar</span>';
    document.getElementById('m-emri').value = '';
    document.getElementById('m-mbiemri').value = '';
    document.getElementById('m-pozita').value = '';
    document.getElementById('m-email').value = '';
    document.getElementById('m-telefoni').value = '';
    document.getElementById('m-username').value = '';
    document.getElementById('m-password').value = '';
    document.getElementById('m-role').value = 'staff';
    document.getElementById('m-dega').value = 'HQ';
    document.getElementById('modal-overlay').classList.add('active');
}

function mbyllModal() {
    document.getElementById('modal-overlay').classList.remove('active');
}

function ruajStaf() {
    const emri = document.getElementById('m-emri').value.trim();
    const mbiemri = document.getElementById('m-mbiemri').value.trim();
    const username = document.getElementById('m-username').value.trim();
    const password = document.getElementById('m-password').value.trim();
    if (!emri || !username || !password) { alert('Plotësoni fushat e detyrueshme!'); return; }

    const antar = {
        emri, mbiemri,
        pozita: document.getElementById('m-pozita').value.trim(),
        email: document.getElementById('m-email').value.trim(),
        telefoni: document.getElementById('m-telefoni').value.trim(),
        username, password,
        role: document.getElementById('m-role').value,
        dega: document.getElementById('m-dega').value,
        dataShtimit: new Date().toISOString().split('T')[0]
    };

    if (editIndex >= 0) {
        stafi[editIndex] = antar;
    } else {
        stafi.push(antar);
    }

    ruajNeStorage();
    mbyllModal();
    renderTabela();
    renderOrganogram();
}

function fshijStaf(index) {
    const user = JSON.parse(localStorage.getItem('user_aktual'));
    if (!user || user.role !== 'superadmin') { alert('Nuk keni qasje!'); return; }
    if (confirm('A jeni i sigurt që doni të fshini këtë anëtar?')) {
        stafi.splice(index, 1);
        ruajNeStorage();
        renderTabela();
        renderOrganogram();
    }
}

function editoStaf(index) {
    const user = JSON.parse(localStorage.getItem('user_aktual'));
    if (!user || user.role !== 'superadmin') { alert('Nuk keni qasje!'); return; }
    editIndex = index;
    const s = stafi[index];
    document.getElementById('modal-title').innerHTML = 'Edito <span style="font-weight:500">Anëtar</span>';
    document.getElementById('m-emri').value = s.emri;
    document.getElementById('m-mbiemri').value = s.mbiemri || '';
    document.getElementById('m-pozita').value = s.pozita || '';
    document.getElementById('m-email').value = s.email || '';
    document.getElementById('m-telefoni').value = s.telefoni || '';
    document.getElementById('m-username').value = s.username;
    document.getElementById('m-password').value = s.password;
    document.getElementById('m-role').value = s.role;
    document.getElementById('m-dega').value = s.dega || 'HQ';
    document.getElementById('modal-overlay').classList.add('active');
}

function filtro() { renderTabela(); }

// Helper: bashkon management + dep_management për filtrim nga KPI
function roleMatch(sRole, filterVal) {
    if (filterVal === 'all') return true;
    if (filterVal === 'management') return sRole === 'management' || sRole === 'dep_management';
    return sRole === filterVal;
}

// Helper: render roli si tag
function renderRoleTag(role) {
    const map = {
        management:     { cls: 'tag-biznes',  text: 'Management' },
        dep_management: { cls: 'tag-biznes',  text: 'Dep. Management' },
        staff_hq:       { cls: 'tag-familje', text: 'Staff HQ' },
        staff:          { cls: 'tag-individ', text: 'Staff' },
        superadmin:     { cls: 'tag-biznes',  text: 'Super Admin' }
    };
    const r = map[role] || { cls: '', text: role };
    return `<span class="badge-lloji ${r.cls}">${r.text}</span>`;
}

function renderTabela() {
    const filterRoleEl = document.getElementById('filter-role');
    const filterRole = filterRoleEl ? filterRoleEl.value : 'all';
    const filterDega = document.getElementById('filter-dega').value;
    const search = document.getElementById('search-staf').value.toLowerCase();

    const filtered = stafi.filter(s => {
        const roleOk = roleMatch(s.role, filterRole);
        const degaOk = filterDega === 'all' || s.dega === filterDega;
        const searchOk = (s.emri + ' ' + (s.mbiemri || '')).toLowerCase().includes(search);
        return roleOk && degaOk && searchOk;
    });

    // KPI counts — gjithmonë nga totali (jo nga filtered)
    const setText = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    setText('count-total', stafi.length);
    setText('count-mgmt',  stafi.filter(s => s.role === 'management' || s.role === 'dep_management').length);
    setText('count-hq',    stafi.filter(s => s.role === 'staff_hq').length);
    setText('count-staff', stafi.filter(s => s.role === 'staff').length);

    const tbody = document.getElementById('stafi-tbody');
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--s-text-faint);">Nuk ka anëtarë që përputhen.</td></tr>';
        return;
    }

    const user = JSON.parse(localStorage.getItem('user_aktual') || '{}');
    const mund = user && user.role === 'superadmin';

    tbody.innerHTML = filtered.map(s => {
        const idx = stafi.indexOf(s);
        const emriPlote = `${s.emri} ${s.mbiemri || ''}`.trim();
        const iniciali = (s.emri[0] || '') + ((s.mbiemri || '')[0] || '');
        return `<tr>
            <td>
                <div class="klient-name">
                    <span style="display:inline-flex;align-items:center;gap:8px">
                        <span style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,var(--s-brand-dark),var(--s-brand));color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:10px;font-weight:800">${iniciali.toUpperCase()}</span>
                        ${emriPlote}
                    </span>
                </div>
            </td>
            <td>${s.pozita || '-'}</td>
            <td>${renderRoleTag(s.role)}</td>
            <td>${s.dega || '-'}</td>
            <td>${s.email || '-'}</td>
            <td>${s.telefoni || '-'}</td>
            <td style="text-align:right;">
                <div class="action-icon-btns" style="justify-content:flex-end">
                    ${mund ? `<button onclick="editoStaf(${idx})" title="Edito"><i data-lucide="pencil"></i></button>` : ''}
                    ${mund ? `<button onclick="fshijStaf(${idx})" title="Fshi"><i data-lucide="trash-2"></i></button>` : ''}
                </div>
            </td>
        </tr>`;
    }).join('');

    if (window.lucide) lucide.createIcons();
}

function renderOrganogram() {
    const container = document.getElementById('organogram');
    if (!container) return;

    const grouped = {};
    deget.forEach(d => grouped[d] = []);
    stafi.forEach(s => {
        const dega = s.dega || 'HQ';
        if (grouped[dega]) grouped[dega].push(s);
    });

    container.innerHTML = deget.map(dega => {
        const anetaret = grouped[dega];
        if (anetaret.length === 0) return '';
        return `
        <div class="org-dega">
            <div class="org-dega-title">
                <i data-lucide="building-2"></i>
                <span>${dega}</span>
                <span class="org-count">${anetaret.length}</span>
            </div>
            <div class="org-karta-list">
                ${anetaret.map(s => {
                    const iniciali = (s.emri[0] || '') + ((s.mbiemri || '')[0] || '');
                    return `
                    <div class="org-karta">
                        <div class="org-avatar">${iniciali.toUpperCase()}</div>
                        <div class="org-info">
                            <div class="org-emri">${s.emri} ${s.mbiemri || ''}</div>
                            <div class="org-pozita">${s.pozita || '-'}</div>
                            <div class="org-role-wrap">${renderRoleTag(s.role)}</div>
                            ${s.email || s.telefoni ? `<div class="org-kontakt">${s.email || ''}${s.email && s.telefoni ? ' · ' : ''}${s.telefoni || ''}</div>` : ''}
                        </div>
                    </div>`;
                }).join('')}
            </div>
        </div>`;
    }).join('');

    if (window.lucide) lucide.createIcons();
}

document.addEventListener('DOMContentLoaded', function() {
    renderTabela();
    renderOrganogram();
});