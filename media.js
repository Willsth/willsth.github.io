// Click-to-load video (YouTube embeds and self-hosted clips) and enlargeable paper figures.
// Nothing is requested from YouTube until a visitor presses play; without JavaScript the
// posters, figures and "Video" chips are plain links.
(function () {
    function embed(id, title) {
        const iframe = document.createElement('iframe');
        iframe.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
        iframe.title = title || 'YouTube video';
        iframe.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen';
        iframe.allowFullscreen = true;
        return iframe;
    }

    // Enlarged paper figure: the version matching the visitor's theme, with its caption
    let lightbox;
    function enlarge(fig) {
        if (!lightbox) {
            lightbox = document.createElement('dialog');
            lightbox.className = 'lightbox';
            lightbox.addEventListener('click', e => {
                if (e.target === lightbox || e.target.closest('.lightbox-close')) lightbox.close();
            });
            lightbox.addEventListener('close', () => lightbox.replaceChildren());
            document.body.append(lightbox);
        }
        const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const source = fig.querySelector(dark ? '.only-dark' : '.only-light') || fig.querySelector('.figure-zoom');
        const media = source.querySelector('video, img').cloneNode();
        const figure = document.createElement('figure');
        figure.append(media);
        const caption = fig.querySelector('figcaption');
        if (caption) figure.append(caption.cloneNode(true));
        const close = document.createElement('button');
        close.className = 'lightbox-close';
        close.setAttribute('aria-label', 'Close');
        close.textContent = '×';
        lightbox.replaceChildren(figure, close);
        lightbox.showModal();
        if (media.play && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) media.play();
    }

    document.addEventListener('click', e => {
        // <a class="figure-zoom"> paper visual → lightbox
        const zoom = e.target.closest('a.figure-zoom');
        if (zoom) {
            e.preventDefault();
            enlarge(zoom.closest('figure'));
            return;
        }

        // <a class="video" data-yt="ID"> thumbnail → player in place
        const facade = e.target.closest('a.video[data-yt]');
        if (facade) {
            e.preventDefault();
            facade.replaceChildren(embed(facade.dataset.yt, facade.getAttribute('aria-label')));
            facade.removeAttribute('href');
            return;
        }

        // <a class="video" data-src="file.mp4"> poster → self-hosted player in place
        const local = e.target.closest('a.video[data-src]');
        if (local) {
            e.preventDefault();
            const video = document.createElement('video');
            video.src = local.dataset.src;
            video.controls = video.autoplay = video.playsInline = true;
            video.setAttribute('aria-label', local.getAttribute('aria-label').replace(/^Play: /, ''));
            local.replaceChildren(video);
            local.removeAttribute('href');
            local.removeAttribute('data-src');   // later clicks belong to the player's own controls
            return;
        }

        // <a class="chip" data-yt="ID" aria-controls="player-id"> → toggle a player under the paper
        const chip = e.target.closest('a.chip[data-yt]');
        if (chip) {
            e.preventDefault();
            const box = document.getElementById(chip.getAttribute('aria-controls'));
            const open = chip.getAttribute('aria-expanded') !== 'true';
            chip.setAttribute('aria-expanded', open);
            box.hidden = !open;
            if (open && !box.firstChild) {
                const frame = document.createElement('div');
                frame.className = 'video';
                frame.append(embed(chip.dataset.yt, chip.dataset.title));
                box.append(frame);
            } else if (!open) {
                box.replaceChildren();   // stop playback
            }
        }
    });

    // Looping figure clips stay still for visitors who prefer reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        document.querySelectorAll('video[autoplay]').forEach(v => { v.removeAttribute('autoplay'); v.pause(); });
    }
}());
