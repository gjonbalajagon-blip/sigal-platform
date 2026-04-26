function handleLogin() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorMsg = document.getElementById('error-msg');

    if (!email || !password) {
        errorMsg.textContent = 'Please fill in all fields.';
        return;
    }

    // Temporary test login (do ta zëvendësojmë me Supabase)
    if (email === 'admin@sigal.com' && password === 'admin123') {
        window.location.href = 'pages/dashboard.html';
    } else {
        errorMsg.textContent = 'Incorrect email or password.';
    }
}

function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    sidebar.classList.toggle('collapsed');
    mainContent.classList.toggle('expanded');
}

// ============================================================
// NJOFTIMET — Bell icon + dropdown
// ============================================================
(function() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initNjoftimet);
    } else {
        initNjoftimet();
    }

    function initNjoftimet() {
        const topbar = document.querySelector('.topbar');
        if (!topbar) return;

        // Prefer .topbar-right; fallback to .topbar
        const host = topbar.querySelector('.topbar-right') || topbar;

        // Krijo / ripërdor container për utils (bell + user) — qëndron djathtas fare
        let utils = host.querySelector('.topbar-utils');
        if (!utils) {
            utils = document.createElement('div');
            utils.className = 'topbar-utils';
            host.appendChild(utils);
        }

        // Inject bell (only if not already present)
        if (!document.getElementById('bell-wrapper')) {
            const bellWrapper = document.createElement('div');
            bellWrapper.id = 'bell-wrapper';
            bellWrapper.style.cssText = 'position:relative;';
            bellWrapper.innerHTML = `
                <div id="bell-btn" style="width:36px;height:36px;border-radius:8px;border:1px solid #e2e8f0;background:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;position:relative;transition:all .15s" onclick="toggleNjoftimetDropdown()">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                    <span id="bell-count" style="position:absolute;top:-4px;right:-4px;min-width:18px;height:18px;border-radius:9px;background:#ef4444;color:#fff;font-size:10px;font-weight:700;display:none;align-items:center;justify-content:center;padding:0 4px;line-height:1;font-family:inherit"></span>
                </div>
                <div id="bell-dropdown" style="display:none;position:absolute;top:44px;right:0;width:360px;max-height:420px;overflow-y:auto;background:#fff;border:1px solid #e2e8f0;border-radius:12px;box-shadow:0 8px 30px rgba(0,0,0,.12);z-index:999">
                    <div style="padding:12px 16px;border-bottom:1px solid #e2e8f0;display:flex;align-items:center;justify-content:space-between">
                        <span style="font-size:13px;font-weight:600;color:#1a2332">Njoftimet</span>
                        <span id="bell-total" style="font-size:11px;color:#64748b"></span>
                    </div>
                    <div id="bell-list" style="padding:4px 0"></div>
                </div>
            `;
            utils.appendChild(bellWrapper);
        }

        // Inject user tag (ose lëviz existingun te utils, nëse është jashtë)
        let userTag = document.querySelector('.topbar-user');
        if (!userTag) {
            let user = {};
            try { user = JSON.parse(localStorage.getItem('user_aktual') || localStorage.getItem('currentUser') || '{}'); } catch(e) {}
            const emri = user.emri || 'Agon';
            const mbiemri = user.mbiemri || '';
            const roli = user.role || user.roli || 'Admin';
            const iniciali = (emri[0] || 'A').toUpperCase();
            const emriFull = (emri + ' ' + mbiemri).trim();
            const roliCap = roli.charAt(0).toUpperCase() + roli.slice(1).toLowerCase();

            userTag = document.createElement('div');
            userTag.className = 'topbar-user';
            userTag.innerHTML = '<div class="tu-avatar">' + iniciali + '</div>'
                + '<div class="tu-info"><div class="tu-name">' + emriFull + '</div><div class="tu-role">' + roliCap + '</div></div>';
        }
        // Sigurohu që user tag është brenda utils (djathtas fare)
        if (userTag.parentElement !== utils) utils.appendChild(userTag);

        perditesoNjoftimet();

        document.addEventListener('click', function(e) {
            const bw = document.getElementById('bell-wrapper');
            const dd = document.getElementById('bell-dropdown');
            if (bw && dd && !bw.contains(e.target)) {
                dd.style.display = 'none';
            }
        });
    }

    window.toggleNjoftimetDropdown = function() {
        const dd = document.getElementById('bell-dropdown');
        dd.style.display = dd.style.display === 'none' ? 'block' : 'none';
    };

    window.perditesoNjoftimet = function() {
        let rinovimet = [];
        try { rinovimet = JSON.parse(localStorage.getItem('rinovimet_data') || '[]'); } catch(e) { return; }

        let user = {};
        try { user = JSON.parse(localStorage.getItem('user_aktual') || localStorage.getItem('currentUser') || '{}'); } catch(e) {}
        const roli = (user.role || user.roli || '').toLowerCase();
        if (roli !== 'superadmin' && roli !== 'management' && roli !== 'dep_management') {
            const dega = (user.dega || '').toLowerCase();
            if (dega) rinovimet = rinovimet.filter(r => (r.dega || '').toLowerCase() === dega);
        }

        const now = new Date();
        const njoftimet = [];

        rinovimet.forEach(r => {
            if (r.statusi === 'rinovuar' || r.statusi === 'humbur') return;
            const mbarimit = parseDateNj(r.data_mbarimit);
            if (!mbarimit || mbarimit.getTime() === 0) return;
            const ditet = Math.ceil((mbarimit - now) / (1000 * 60 * 60 * 24));
            if (ditet < 0) return;

            if (r.statusi === 'pa_filluar' && ditet <= 30) {
                njoftimet.push({
                    id: r.id, kontraktuesi: r.kontraktuesi, nr_kontrates: r.nr_kontrates,
                    ditet: ditet,
                    tipi: ditet <= 15 ? 'kritik' : 'paralajmerim',
                    mesazhi: ditet <= 15
                        ? 'Nuk është kontaktuar — skadon për ' + ditet + ' ditë'
                        : 'Nuk është kontaktuar — kushtet kërkojnë njoftim 30 ditë para'
                });
            } else if (r.statusi === 'kontaktuar' && ditet <= 7) {
                njoftimet.push({
                    id: r.id, kontraktuesi: r.kontraktuesi, nr_kontrates: r.nr_kontrates,
                    ditet: ditet, tipi: 'rikujtim',
                    mesazhi: 'Ende pa konfirmim — skadon për ' + ditet + ' ditë'
                });
            }
        });

        njoftimet.sort((a, b) => a.ditet - b.ditet);

        const countEl = document.getElementById('bell-count');
        const bellBtn = document.getElementById('bell-btn');
        if (!countEl || !bellBtn) return;

        if (njoftimet.length > 0) {
            countEl.style.display = 'flex';
            countEl.textContent = njoftimet.length > 99 ? '99+' : njoftimet.length;
            bellBtn.style.borderColor = '#fecaca';
            bellBtn.style.background = '#fef2f2';
        } else {
            countEl.style.display = 'none';
            bellBtn.style.borderColor = '#e2e8f0';
            bellBtn.style.background = '#fff';
        }

        var totalEl = document.getElementById('bell-total');
        if (totalEl) totalEl.textContent = njoftimet.length > 0 ? njoftimet.length + ' aktive' : 'Asnjë njoftim';

        var listEl = document.getElementById('bell-list');
        if (!listEl) return;

        if (njoftimet.length === 0) {
            listEl.innerHTML = '<div style="padding:24px 16px;text-align:center;color:#94a3b8;font-size:13px">Asnjë njoftim aktiv ✓</div>';
            return;
        }

        var html = '';
        njoftimet.forEach(function(n) {
            var bgMap = { kritik: '#fef2f2', paralajmerim: '#fffbeb', rikujtim: '#eff6ff' };
            var dotMap = { kritik: '#ef4444', paralajmerim: '#f59e0b', rikujtim: '#3b82f6' };
            var borderMap = { kritik: '#fecaca', paralajmerim: '#fde68a', rikujtim: '#bfdbfe' };

            html += '<a href="rinovimet.html?hap=' + n.id + '" style="display:flex;align-items:flex-start;gap:10px;padding:10px 16px;text-decoration:none;border-bottom:1px solid #f1f5f9;transition:background .1s;cursor:pointer" onmouseover="this.style.background=\'' + bgMap[n.tipi] + '\'" onmouseout="this.style.background=\'\'">'
                + '<span style="width:8px;height:8px;border-radius:50%;background:' + dotMap[n.tipi] + ';flex-shrink:0;margin-top:5px"></span>'
                + '<div style="flex:1;min-width:0">'
                + '<div style="font-size:12px;font-weight:600;color:#1a2332;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + escNj(n.kontraktuesi) + '</div>'
                + '<div style="font-size:11px;color:#64748b;margin-top:1px">' + escNj(n.mesazhi) + '</div>'
                + '</div>'
                + '<span style="font-size:10px;font-weight:700;color:' + dotMap[n.tipi] + ';white-space:nowrap;padding:2px 8px;border-radius:10px;background:' + bgMap[n.tipi] + ';border:1px solid ' + borderMap[n.tipi] + '">' + n.ditet + 'd</span>'
                + '</a>';
        });
        listEl.innerHTML = html;
    };

    function parseDateNj(s) {
        if (!s) return null;
        if (s instanceof Date) return s;
        s = String(s);
        var p = s.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
        if (p) return new Date(parseInt(p[3]), parseInt(p[2]) - 1, parseInt(p[1]));
        var d = new Date(s);
        return isNaN(d.getTime()) ? null : d;
    }

    function escNj(s) { return s ? String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : ''; }
})();

// ============================================================
// SIDEBAR — auto-active state per faqen aktuale
// ============================================================
(function() {
    function setActive() {
        const path = (window.location.pathname.split('/').pop() || '').toLowerCase();
        if (!path) return;
        document.querySelectorAll('.sidebar-nav .nav-item').forEach(item => {
            const href = (item.getAttribute('href') || '').toLowerCase();
            if (!href || href === '#') return;
            const target = href.split('/').pop();
            if (target === path) {
                item.classList.add('active');
            } else if (item.classList.contains('active') && target !== path) {
                item.classList.remove('active');
            }
        });
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setActive);
    } else {
        setActive();
    }
})();

// ============================================================
// GLOBAL DRAWER CLOSE — overlay click + ESC
// ============================================================
(function() {
    function closeOverlay(el) {
        if (!el) return;
        el.classList.remove('open', 'active');
    }
    document.addEventListener('click', function(e) {
        const t = e.target;
        if (!t || !t.classList) return;
        if (t.classList.contains('drawer-overlay') ||
            t.classList.contains('modal-overlay') ||
            t.classList.contains('rin-overlay') ||
            t.classList.contains('rin-modal-overlay') ||
            t.classList.contains('deb-modal-overlay') ||
            t.classList.contains('deb-overlay') ||
            t.classList.contains('deb-report-modal') ||
            t.classList.contains('rin-humbje-modal')) {
            closeOverlay(t);
        }
    });
    document.addEventListener('keydown', function(e) {
        if (e.key !== 'Escape') return;
        document.querySelectorAll(
            '.drawer-overlay.open, .drawer-overlay.active, ' +
            '.modal-overlay.active, .modal-overlay.open, ' +
            '.rin-overlay.open, .rin-modal-overlay.open, ' +
            '.deb-modal-overlay.open, .deb-overlay.open, ' +
            '.deb-report-modal.open, .rin-humbje-modal.open'
        ).forEach(closeOverlay);
    });
})();