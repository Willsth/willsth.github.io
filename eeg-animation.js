// Draws real EEG (eeg_data.json) as scrolling traces on every canvas.eeg-canvas.
// The canvas fills its positioned parent. Optional data-channels="N" draws only the first N channels.
(function () {
    const canvases = document.querySelectorAll('canvas.eeg-canvas');
    if (!canvases.length) return;

    const SPEED   = 40;    // CSS px per second
    const SECONDS = 10;    // seconds of EEG visible across 1440 px of width
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    fetch('eeg_data.json')
        .then(r => r.json())
        .then(d => {
            const fs = d.fs;
            const n  = d.data[0].length;
            const arrays = d.data.map(ch => new Float32Array(ch));

            // Smooth the loop boundary: crossfade the last second into the first
            const fade = Math.round(fs);
            for (const a of arrays) {
                for (let i = 0; i < fade; i++) {
                    const alpha = i / fade;
                    a[n - fade + i] = a[n - fade + i] * (1 - alpha) + a[i] * alpha;
                }
            }

            canvases.forEach(c => trace(c, arrays, fs, n));
        });

    function trace(canvas, arrays, fs, n) {
        const ctx = canvas.getContext('2d');
        const channels = arrays.slice(0, +canvas.dataset.channels || arrays.length);
        const spp = (fs * SECONDS) / 1440;   // samples per CSS px, independent of width
        let w = 0, h = 0, offset = 0, last = 0, visible = true, raf = 0;

        function resize() {
            const dpr = window.devicePixelRatio || 1;
            w = canvas.clientWidth;
            h = canvas.clientHeight;
            canvas.width  = w * dpr;
            canvas.height = h * dpr;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            draw();
        }

        function draw() {
            ctx.clearRect(0, 0, w, h);
            ctx.strokeStyle = getComputedStyle(canvas).color;
            ctx.lineWidth = 1;
            ctx.lineJoin = 'round';

            const spacing = h / (channels.length + 1);
            const amp = spacing * 0.3;

            for (let c = 0; c < channels.length; c++) {
                const arr = channels[c];
                const cy = spacing * (c + 1);
                ctx.beginPath();
                for (let x = 0; x <= w; x += 1) {
                    const t  = (offset + x) * spp;
                    const i0 = Math.floor(t) % n;
                    const f  = t - Math.floor(t);
                    const v  = arr[i0] * (1 - f) + arr[(i0 + 1) % n] * f;
                    x === 0 ? ctx.moveTo(x, cy + v * amp) : ctx.lineTo(x, cy + v * amp);
                }
                ctx.stroke();
            }
        }

        function frame(now) {
            if (last) offset += SPEED * Math.min(now - last, 100) / 1000;
            last = now;
            draw();
            raf = requestAnimationFrame(frame);
        }

        function update() {
            cancelAnimationFrame(raf);
            last = 0;
            if (visible && !reduceMotion.matches) raf = requestAnimationFrame(frame);
            else draw();
        }

        new ResizeObserver(resize).observe(canvas);
        new IntersectionObserver(([e]) => { visible = e.isIntersecting; update(); }).observe(canvas);
        reduceMotion.addEventListener('change', update);
        document.addEventListener('themechange', draw);
    }
}());
