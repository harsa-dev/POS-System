// ---------------------------------------------------------------------------
// Lightweight audio notification via AudioContext — no audio files needed.
// Silently no-ops when AudioContext is unavailable (SSR, blocked policy, etc.)
// ---------------------------------------------------------------------------

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    if (!audioCtx || audioCtx.state === "closed") {
      audioCtx = new AudioContext();
    }
    return audioCtx;
  } catch {
    return null;
  }
}

export function playBeep(
  frequency = 880,
  durationMs = 120,
  volume = 0.25,
): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.type = "sine";
    oscillator.frequency.value = frequency;

    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      ctx.currentTime + durationMs / 1000,
    );

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + durationMs / 1000);
  } catch {
    // Ignore — audio is a nice-to-have
  }
}

// Two-tone chime for "new order" alerts
export function playNewOrderChime(): void {
  playBeep(880, 120, 0.25);
  setTimeout(() => playBeep(1100, 160, 0.2), 130);
}
