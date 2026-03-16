"""
Loads eeg.edf, selects 15 standard channels, finds the most alpha-rich
20-second segment, bandpass filters, downsamples to 128 Hz, normalises
per-channel, and writes eeg_data.json for the canvas animation.
"""

import json
import numpy as np
import mne

EDF      = "eeg.edf"
OUT      = "eeg_data.json"
TARGET_FS = 128          # output sample rate (Hz)
SEG_SECS   = 20          # loop segment length (seconds)
START_SECS = 369         # manual start: 6 min 9 sec

# 15 channels matching our AP layout (frontal → occipital)
CHANNELS = ["FP1", "FP2",
            "F3",  "Fz",  "F4",
            "C3",  "Cz",  "C4",
            "O1",  "O2"]

# ── Load ─────────────────────────────────────────────────────────────────────
raw = mne.io.read_raw_edf(EDF, preload=True, verbose=False)

# Normalise channel name capitalisation
name_map = {ch.upper(): ch for ch in raw.ch_names}
picks    = [name_map[c.upper()] for c in CHANNELS]

raw.pick(picks)
raw.reorder_channels(picks)

sfreq = raw.info["sfreq"]
print(f"Loaded {len(picks)} channels at {sfreq} Hz, {raw.times[-1]:.1f} s total")

# ── Bandpass 0.5–40 Hz then notch 50 Hz ─────────────────────────────────────
raw.filter(0.5, 40.0, fir_design="firwin", verbose=False)
raw.notch_filter(50.0, verbose=False)

data, _ = raw.get_data(return_times=True)   # shape: (15, n_samples)

# ── Cut the requested segment ─────────────────────────────────────────────────
start_sample = int(START_SECS * sfreq)
win_len      = int(sfreq * SEG_SECS)
print(f"Using segment: {START_SECS:.1f} – {START_SECS + SEG_SECS:.1f} s")

segment = data[:, start_sample : start_sample + win_len]   # (15, win_len)

# ── Downsample to TARGET_FS ───────────────────────────────────────────────────
ratio = int(sfreq / TARGET_FS)
segment = segment[:, ::ratio]                          # simple decimation (already LP-filtered)
print(f"Downsampled to {TARGET_FS} Hz → {segment.shape[1]} samples per channel")

# ── Per-channel normalisation (robust: scale by 2×IQR) ───────────────────────
for i in range(segment.shape[0]):
    q25, q75 = np.percentile(segment[i], [25, 75])
    iqr = q75 - q25
    if iqr > 0:
        segment[i] /= (iqr * 2)      # most samples will fall in [-0.5, 0.5]
    segment[i] = np.clip(segment[i], -2.5, 2.5)   # cap extreme artefacts

# ── Write JSON ───────────────────────────────────────────────────────────────
out = {
    "fs":       TARGET_FS,
    "duration": SEG_SECS,
    "channels": CHANNELS,
    "data":     [
        [round(float(v), 4) for v in ch]
        for ch in segment
    ]
}

with open(OUT, "w") as f:
    json.dump(out, f, separators=(",", ":"))

size_kb = sum(len(json.dumps(ch)) for ch in out["data"]) / 1024
print(f"Written {OUT}  (~{size_kb:.0f} KB payload)")
