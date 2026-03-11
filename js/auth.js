const SUPER_ADMIN = { username: 'agon', password: 'sigal2026', role: 'superadmin', emri: 'Agon' };

function login(username, password) {
    // Super admin check
    if (username === SUPER_ADMIN.username && password === SUPER_ADMIN.password) {
        const user = { username, role: SUPER_ADMIN.role, emri: SUPER_ADMIN.emri };
        localStorage.setItem('user_aktual', JSON.stringify(user));
        return { success: true, user };
    }

    // Staff check
    const stafi = JSON.parse(localStorage.getItem('stafi')) || [];
    const user = stafi.find(s => s.username === username && s.password === password);
    if (user) {
        localStorage.setItem('user_aktual', JSON.stringify(user));
        return { success: true, user };
    }
    return { success: false };
}

function logout() {
    localStorage.removeItem('user_aktual');
    window.location.href = '../index.html';
}

function getUserAktual() {
    return JSON.parse(localStorage.getItem('user_aktual'));
}

function kaQasje(faqja) {
    const user = getUserAktual();
    if (!user) return false;
    if (['superadmin', 'management', 'dep_management'].includes(user.role)) return true;
    // staff dhe staff_hq — vetem faqjet bazike
    const faqjetLejohet = ['dashboard', 'oferta', 'kontratat', 'faturimi'];
    return faqjetLejohet.includes(faqja);
}

function checkAuth() {
    const user = getUserAktual();
    if (!user) {
        window.location.href = '../index.html';
        return null;
    }
    return user;
}
function filtroSipasRolit(lista, fushaKrijuesi) {
    const user = getUserAktual();
    if (!user) return lista;
    if (['superadmin', 'management', 'dep_management'].includes(user.role)) return lista;
    return lista.filter(item => !item[fushaKrijuesi] || item[fushaKrijuesi].toLowerCase() === user.username.toLowerCase());
}