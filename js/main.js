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
}function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    sidebar.classList.toggle('collapsed');
    mainContent.classList.toggle('expanded');
}