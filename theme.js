// Light/dark theme: follows the system unless the visitor picks one with the nav toggle,
// which is remembered per browser. Loaded in <head> so a saved choice applies before first paint.
// Fires a "themechange" event on document whenever the effective theme may have changed.
(function () {
    const root = document.documentElement;
    const system = window.matchMedia('(prefers-color-scheme: dark)');
    const systemTheme = () => (system.matches ? 'dark' : 'light');
    const current = () => root.dataset.theme || systemTheme();

    try {
        const saved = localStorage.getItem('theme');
        if (saved === 'light' || saved === 'dark') root.dataset.theme = saved;
    } catch (e) { /* storage blocked: follow the system */ }

    function sync() {
        document.querySelectorAll('.theme-toggle').forEach(b => b.setAttribute('aria-pressed', current() === 'dark'));
        document.dispatchEvent(new Event('themechange'));
    }

    document.addEventListener('click', e => {
        if (!e.target.closest('.theme-toggle')) return;
        const theme = current() === 'dark' ? 'light' : 'dark';
        // Choosing the system's own scheme drops the override, so the site follows the system again
        try {
            if (theme === systemTheme()) localStorage.removeItem('theme');
            else localStorage.setItem('theme', theme);
        } catch (e) { /* not remembered, but still applied */ }
        if (theme === systemTheme()) delete root.dataset.theme;
        else root.dataset.theme = theme;
        sync();
    });

    system.addEventListener('change', sync);
    document.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('.theme-toggle').forEach(b => { b.hidden = false; });
        sync();
    });
}());
