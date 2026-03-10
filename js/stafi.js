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
    if (user.role !== 'superadmin') { alert('Nuk keni qasje!'); return; }
    editIndex = -1;
    document.getElementById('modal-title').textContent = 'Shto Staf';
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
    if (user.role !== 'superadmin') { alert('Nuk keni qasje!'); return; }
    if (confirm('A jeni i sigurt që doni të fshini këtë anëtar?')) {
        stafi.splice(index, 1);
        ruajNeStorage();
        renderTabela();
        renderOrganogram();
    }
}

function editoStaf(index) {
    const user = JSON.parse(localStorage.getItem('user_aktual'));
    if (user.role !== 'superadmin') { alert('Nuk keni qasje!'); return; }
    editIndex = index;
    const s = stafi[index];
    document.getElementById('modal-title').textContent = 'Edito Staf';
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

function renderTabela() {
    const filterRole = document.getElementById('filter-role').value;
    const filterDega = document.getElementById('filter-dega').value;
    const search = document.getElementById('search-staf').value.toLowerCase();

    const filtered = stafi.filter(s => {
        const roleOk = filterRole === 'all' || s.role === filterRole;
        const degaOk = filterDega === 'all' || s.dega === filterDega;
        const searchOk = (s.emri + ' ' + s.mbiemri).toLowerCase().includes(search);
        return roleOk && degaOk && searchOk;
    });

    document.getElementById('count-total').textContent = stafi.length;
    document.getElementById('count-hq').textContent = stafi.filter(s => s.dega === 'HQ').length;

    const tbody = document.getElementById('stafi-tbody');
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;color:#888;">Nuk ka anëtarë.</td></tr>';
        return;
    }

    tbody.innerHTML = filtered.map(s => {
        const idx = stafi.indexOf(s);
        const user = JSON.parse(localStorage.getItem('user_aktual'));
        const mund = user.role === 'superadmin';
        return `<tr>
            <td><strong>${s.emri} ${s.mbiemri || ''}</strong></td>
            <td>${s.pozita || '-'}</td>
            <td><span class="badge-lloji ${s.role === 'management' || s.role === 'dep_management' ? 'biznes' : s.role === 'staff_hq' ? 'familje' : 'individ'}">${rolet[s.role] || s.role}</span></td>
            <td>${s.dega || '-'}</td>
            <td>${s.email || '-'}</td>
            <td>${s.telefoni || '-'}</td>
            <td>
                <div class="action-btns">
                    ${mund ? `<button class="btn-edit" onclick="editoStaf(${idx})" title="Edito"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg></button>` : ''}
                    ${mund ? `<button class="btn-delete" onclick="fshijStaf(${idx})" title="Fshi"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg></button>` : ''}
                </div>
            </td>
        </tr>`;
    }).join('');
}

function renderOrganogram() {
    const container = document.getElementById('organogram');
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
            <div class="org-dega-title">${dega}</div>
            <div class="org-karta-list">
                ${anetaret.map(s => `
                <div class="org-karta">
                    <div class="org-avatar">${s.emri[0]}${(s.mbiemri||'')[0]||''}</div>
                    <div class="org-info">
                        <div class="org-emri">${s.emri} ${s.mbiemri || ''}</div>
                        <div class="org-pozita">${s.pozita || '-'}</div>
                        <div class="org-role">${rolet[s.role] || s.role}</div>
                        <div class="org-kontakt">${s.email || ''} ${s.telefoni ? '· ' + s.telefoni : ''}</div>
                    </div>
                </div>`).join('')}
            </div>
        </div>`;
    }).join('');
}

document.addEventListener('DOMContentLoaded', function() {
    renderTabela();
    renderOrganogram();
});