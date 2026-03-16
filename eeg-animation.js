(function () {
    const canvas = document.getElementById('eeg-bg');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const SPEED = 0.65;   // CSS px per frame

    // ── HiDPI + resize ────────────────────────────────────────────────────────
    let dpr = 1, dispW = 0, dispH = 0;
    let cachedGrad = null, cachedGW = 0;

    function resize() {
        dpr   = window.devicePixelRatio || 1;
        dispW = window.innerWidth;
        dispH = window.innerHeight;
        canvas.width        = dispW * dpr;
        canvas.height       = dispH * dpr;
        canvas.style.width  = dispW + 'px';
        canvas.style.height = dispH + 'px';
        ctx.scale(dpr, dpr);
        cachedGrad = null;
    }

    function getGradient(W) {
        if (cachedGrad && cachedGW === W) return cachedGrad;
        cachedGW   = W;
        cachedGrad = ctx.createLinearGradient(0, 0, W, 0);
        cachedGrad.addColorStop(0.00, 'rgba(45, 210, 145, 0.04)');
        cachedGrad.addColorStop(0.10, 'rgba(45, 210, 145, 0.09)');
        cachedGrad.addColorStop(0.35, 'rgba(45, 210, 145, 0.32)');
        cachedGrad.addColorStop(0.68, 'rgba(45, 210, 145, 0.58)');
        cachedGrad.addColorStop(1.00, 'rgba(45, 210, 145, 0.72)');
        return cachedGrad;
    }

    resize();
    window.addEventListener('resize', resize);

    // ── Load real EEG data ────────────────────────────────────────────────────
    let arrays   = null;   // Float32Array per channel, after crossfade applied
    let N        = 0;
    let NSAMPLES = 0;
    let FS       = 0;

    fetch('eeg_data.json')
        .then(r => r.json())
        .then(d => {
            FS       = d.fs;
            N        = d.channels.length;
            NSAMPLES = d.data[0].length;

            // Convert to Float32Arrays for fast access
            arrays = d.data.map(ch => new Float32Array(ch));

            // Smooth the loop boundary: crossfade last FADE samples into first FADE
            const FADE = Math.round(FS * 1.0);   // 1 second crossfade
            for (let c = 0; c < N; c++) {
                const a = arrays[c];
                for (let i = 0; i < FADE; i++) {
                    const alpha = i / FADE;                          // 0→1
                    // blend the end toward the beginning value
                    a[NSAMPLES - FADE + i] = a[NSAMPLES - FADE + i] * (1 - alpha)
                                           + a[i]                   *      alpha;
                }
            }

            requestAnimationFrame(draw);
        });

    // ── Render loop ───────────────────────────────────────────────────────────
    let t0 = 0;

    function draw() {
        const W = dispW;
        const H = dispH;

        ctx.clearRect(0, 0, W, H);

        // 10 seconds of EEG visible across the full canvas width
        const spp = (FS * 10) / W;   // data samples per CSS pixel

        const spacing = H / (N + 1);   // vertical space per channel
        const amp     = spacing * 0.27;
        
        ctx.strokeStyle = getGradient(W);
        ctx.lineWidth   = 1.0;
        ctx.lineJoin    = 'round';

        for (let c = 0; c < N; c++) {
            const arr = arrays[c];
            const cy  = spacing * (c + 1);

            ctx.beginPath();
            for (let x = 0; x <= W; x++) {
                // Map pixel position to a (fractional) sample index, then loop
                const tSamp = (t0 + x) * spp;
                const i0    = Math.floor(tSamp) % NSAMPLES;
                const i1    = (i0 + 1) % NSAMPLES;
                const frac  = tSamp - Math.floor(tSamp);
                const val   = arr[i0] * (1 - frac) + arr[i1] * frac;

                x === 0 ? ctx.moveTo(x, cy + val * amp)
                        : ctx.lineTo(x, cy + val * amp);
            }
            ctx.stroke();
        }

        t0 += SPEED;
        requestAnimationFrame(draw);
    }

}());
