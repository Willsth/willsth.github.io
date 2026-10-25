// Click-to-load video: YouTube embeds and self-hosted clips. Nothing is requested from
// YouTube until a visitor presses play; without JavaScript the posters and "Video" chips are plain links.
(function () {
    function embed(id, title) {
        const iframe = document.createElement('iframe');
        iframe.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
        iframe.title = title || 'YouTube video';
        iframe.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen';
        iframe.allowFullscreen = true;
        return iframe;
    }

    // <a class="video" data-yt="ID"> thumbnail → player in place
    document.addEventListener('click', e => {
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

    // Looping teaser clips stay still for visitors who prefer reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        document.querySelectorAll('video[autoplay]').forEach(v => { v.removeAttribute('autoplay'); v.pause(); });
    }
}());
