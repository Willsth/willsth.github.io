// stats.html: visitor numbers from the GoatCounter API, drawn in the site's own style.
// The API key lives only in this browser's localStorage; without it the page shows a key form.
// Everything from the API (page titles, referrers) is untrusted, so it goes in via textContent only.
(function () {
    const API = 'https://willsth.goatcounter.com/api/v0';
    const RANGES = { 7: 'day', 30: 'day', 84: 'week', 365: 'month' };
    const $ = s => document.querySelector(s);
    const fmt = n => n.toLocaleString('en-GB');
    let run = 0;

    const store = {
        get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
        set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* kept for this visit only */ } },
        drop(k) { try { localStorage.removeItem(k); } catch (e) { /* nothing stored */ } },
    };
    let key = store.get('gc-key');

    // GoatCounter allows four requests a second, so calls go one at a time with a short gap
    let queue = Promise.resolve();
    function api(path, params) {
        const url = API + path + '?' + new URLSearchParams(params);
        const call = async () => {
            for (let tries = 0; ; tries++) {
                const res = await fetch(url, { headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' } });
                await new Promise(r => setTimeout(r, 260));
                if (res.status === 429 && tries < 3) { await new Promise(r => setTimeout(r, 1000)); continue; }
                if (res.status === 401 || res.status === 403) throw Object.assign(new Error('auth'), { auth: true });
                if (!res.ok) throw new Error('GoatCounter answered ' + res.status);
                return res.json();
            }
        };
        const p = queue.then(call);
        queue = p.catch(() => {});
        return p;
    }

    const hour = d => d.toISOString().slice(0, 14) + '00:00Z';
    const localDay = d => d.toLocaleDateString('en-CA');   // YYYY-MM-DD in local time
    const parseDay = s => new Date(s + 'T00:00:00');

    function period(days) {
        const end = new Date();
        end.setMinutes(60, 0, 0);                          // up to the next full hour
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        if (RANGES[days] === 'month') { start.setDate(1); start.setMonth(start.getMonth() - 11); }
        else start.setDate(start.getDate() - (days - 1));
        const prevStart = new Date(start.getTime() - (end - start));
        return { start, end, prevStart };
    }

    // Daily counts grouped into the bars for this range; weeks are counted back from today
    function bins(stats, group) {
        if (group === 'day') {
            return stats.map(s => ({ day: s.day, value: s.daily }));
        }
        if (group === 'month') {
            const by = new Map();
            stats.forEach(s => {
                const m = s.day.slice(0, 7);
                if (!by.has(m)) by.set(m, { day: m + '-01', value: 0 });
                by.get(m).value += s.daily;
            });
            return [...by.values()];
        }
        const out = [];
        for (let i = stats.length; i > 0; i -= 7) {
            const week = stats.slice(Math.max(0, i - 7), i);
            out.unshift({ day: week[0].day, value: week.reduce((a, s) => a + s.daily, 0) });
        }
        return out;
    }

    function label(day, group, count) {
        const d = parseDay(day);
        if (group === 'month') return d.toLocaleDateString('en-GB', { month: 'short' });
        if (group === 'day' && count <= 7) return d.toLocaleDateString('en-GB', { weekday: 'short' });
        return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    }

    function niceTop(max) {
        if (max <= 4) return 4;
        const raw = max / 4;
        const mag = 10 ** Math.floor(Math.log10(raw));
        const step = [1, 2, 2.5, 5, 10].find(f => f * mag >= raw) * mag;
        return step * 4;
    }

    function el(tag, cls, text) {
        const e = document.createElement(tag);
        if (cls) e.className = cls;
        if (text != null) e.textContent = text;
        return e;
    }

    function drawChart(data, group) {
        const plot = $('#stats-chart');
        const table = $('#stats-table');
        const top = niceTop(Math.max(0, ...data.map(b => b.value)));
        const every = data.length > 12 ? 7 : 1;               // label every bar, or every week
        plot.replaceChildren();
        table.replaceChildren();
        for (let i = 0; i <= 4; i++) {
            const line = el('span', 'chart-gridline');
            line.style.bottom = i * 25 + '%';
            line.append(el('span', null, fmt(top * i / 4)));
            plot.append(line);
        }
        const bars = el('ol', 'chart-bars');
        const unit = { day: 'Day', week: 'Week of', month: 'Month' }[group];
        table.append(el('caption', null, $('#stats-chart-title').textContent));
        const head = el('tr');
        head.append(el('th', null, unit), el('th', null, 'Visitors'));
        table.append(head);
        data.forEach((b, i) => {
            const name = label(b.day, group, data.length);
            const li = el('li');
            li.style.setProperty('--h', (top ? b.value / top * 100 : 0) + '%');
            li.title = name + ': ' + fmt(b.value) + ' visitors';
            if (i === data.length - 1) li.className = 'is-latest';
            li.append(el('span', 'bar-value', fmt(b.value)), el('span', 'bar'));
            if ((data.length - 1 - i) % every === 0) li.append(el('span', 'bar-label', name));
            bars.append(li);
            const row = el('tr');
            row.append(el('th', null, name), el('td', null, fmt(b.value)));
            table.append(row);
        });
        plot.append(bars);
    }

    function drawList(name, rows) {
        const list = $(`[data-list="${name}"]`);
        list.replaceChildren();
        if (!rows.length) { list.append(el('li', 'rank-empty', 'Nothing yet.')); return; }
        const max = Math.max(...rows.map(r => r.count));
        rows.forEach(r => {
            const li = el('li');
            const title = el('span', 'rank-name', r.name);
            if (r.detail) title.append(el('small', null, r.detail));
            const bar = el('span', 'rank-bar');
            bar.style.setProperty('--w', (max ? r.count / max * 100 : 0) + '%');
            li.append(title, el('span', 'rank-value', fmt(r.count)), bar);
            list.append(li);
        });
    }

    const pageName = p => (p.path === '/' || p.path === '/index.html') ? 'Home'
        : (p.title || '').replace(/\s*·\s*William Theodor Lehn-Schiøler$/, '').trim() || p.path;

    function showConnect(message) {
        $('#stats-connect').hidden = false;
        $('#stats-body').hidden = true;
        $('.stats-ranges').hidden = true;
        const err = $('.stats-error');
        err.hidden = !message;
        err.textContent = message || '';
    }

    async function load(days) {
        const id = ++run;
        const group = RANGES[days];
        const { start, end, prevStart } = period(days);
        const range = { start: hour(start), end: hour(end) };
        document.querySelectorAll('[data-range]').forEach(b => b.setAttribute('aria-expanded', b.dataset.range === String(days)));
        $('#stats-body').hidden = false;
        $('#stats-body').setAttribute('aria-busy', 'true');
        try {
            const total = await api('/stats/total', range);
            const prev = await api('/stats/total', { start: hour(prevStart), end: hour(start) });
            const hits = await api('/stats/hits', { ...range, limit: 10 });
            const lists = {};
            for (const page of ['toprefs', 'locations', 'sizes']) {
                lists[page] = (await api('/stats/' + page, { ...range, limit: 10 })).stats;
            }
            if (id !== run) return;

            const stats = total.stats || [];
            const elapsed = Math.max(1, Math.round((end - start) / 864e5));
            const today = stats.find(s => s.day === localDay(new Date()));
            const change = prev.total ? Math.round((total.total - prev.total) / prev.total * 100) : null;
            $('[data-kpi="total"]').textContent = fmt(total.total);
            $('[data-kpi="change"]').textContent = change == null ? '–' : (change > 0 ? '+' : change < 0 ? '−' : '') + Math.abs(change) + '%';
            $('[data-kpi="average"]').textContent = fmt(Math.round(total.total / elapsed * 10) / 10);
            $('[data-kpi="today"]').textContent = fmt(today ? today.daily : 0);

            $('#stats-chart-title').textContent = 'Visitors per ' + group;
            drawChart(bins(stats, group), group);
            drawList('pages', hits.hits.filter(h => !h.event).map(h => ({ name: pageName(h), detail: h.path, count: h.count })));
            drawList('toprefs', lists.toprefs.map(s => ({ name: s.name || 'Direct or unknown', count: s.count })));
            drawList('locations', lists.locations.map(s => ({ name: s.name || 'Unknown', count: s.count })));
            drawList('sizes', lists.sizes.map(s => ({ name: s.name || 'Unknown', count: s.count })));
            $('#stats-updated').textContent = 'Loaded ' + new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        } catch (e) {
            if (id !== run) return;
            if (e.auth) { store.drop('gc-key'); key = null; showConnect('GoatCounter did not accept that key. Check it has the Read statistics permission.'); }
            else showConnect('Could not load the stats (' + e.message + '). Paste the key again to retry.');
        } finally {
            $('#stats-body').removeAttribute('aria-busy');
        }
    }

    function start() {
        $('#stats-connect').hidden = true;
        $('.stats-ranges').hidden = false;
        const saved = Number(store.get('stats-range'));
        load(RANGES[saved] ? saved : 30);
    }

    $('.stats-key').addEventListener('submit', e => {
        e.preventDefault();
        key = $('#stats-key').value.trim();
        if (!key) return;
        store.set('gc-key', key);
        $('#stats-key').value = '';
        start();
    });

    document.querySelectorAll('[data-range]').forEach(b => b.addEventListener('click', () => {
        store.set('stats-range', b.dataset.range);
        load(Number(b.dataset.range));
    }));

    $('#stats-forget').addEventListener('click', () => {
        store.drop('gc-key');
        key = null;
        showConnect();
    });

    if (key) start();
    else showConnect();
}());
