// Visitor counts via GoatCounter (no cookies, no personal data), dashboard at willsth.goatcounter.com.
// Opening any page with #stats marks this browser as the owner's: its own visits stop being counted
// (GoatCounter's `skipgc` flag) and a Stats link to the dashboard appears in the footer. #nostats undoes it.
(function () {
    const DASHBOARD = 'https://willsth.goatcounter.com';
    let owner = false;

    try {
        if (location.hash === '#stats') localStorage.setItem('skipgc', 't');
        if (location.hash === '#nostats') localStorage.removeItem('skipgc');
        owner = localStorage.getItem('skipgc') === 't';
    } catch (e) { /* storage blocked: count as a visitor */ }

    if (location.hash === '#stats' || location.hash === '#nostats') {
        history.replaceState(null, '', location.pathname + location.search);
    }

    const counter = document.createElement('script');
    counter.dataset.goatcounter = DASHBOARD + '/count';
    counter.async = true;
    counter.src = 'https://gc.zgo.at/count.js';
    document.head.appendChild(counter);

    if (!owner) return;
    const add = () => {
        const links = document.querySelector('.site-footer .footer-links');
        if (!links) return;
        const a = document.createElement('a');
        a.href = DASHBOARD;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.textContent = 'Stats';
        links.appendChild(a);
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', add);
    else add();
}());
