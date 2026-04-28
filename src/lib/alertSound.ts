/**
 * Lightweight WebAudio alert siren — no external assets required.
 * Two-tone alternating beep, classic mission-control alarm.
 */

let ctx: AudioContext | null = null;
let activeStop: (() => void) | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC =
      (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext })
        .AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  return ctx;
}

export function playLeakAlert(durationMs = 30000) {
  const ac = getCtx();
  if (!ac) return;
  if (ac.state === "suspended") ac.resume().catch(() => {});

  // Cancel any in-flight alert
  stopLeakAlert();

  const master = ac.createGain();
  master.gain.value = 0.0001;
  master.connect(ac.destination);

  const now = ac.currentTime;
  const end = now + durationMs / 1000;

  // Soft envelope — quick attack, sustain through full duration, gentle release
  master.gain.exponentialRampToValueAtTime(0.18, now + 0.04);
  master.gain.setValueAtTime(0.18, end - 0.25);
  master.gain.exponentialRampToValueAtTime(0.0001, end);

  // Two-tone alternating square oscillator (siren)
  const osc = ac.createOscillator();
  osc.type = "square";
  osc.frequency.setValueAtTime(880, now);

  // Alternate frequencies every 180ms for the full duration
  let t = now;
  let high = false;
  while (t < end) {
    osc.frequency.setValueAtTime(high ? 880 : 1320, t);
    high = !high;
    t += 0.18;
  }

  // Subtle low-pass to take edge off
  const filter = ac.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 2400;

  osc.connect(filter);
  filter.connect(master);
  osc.start(now);
  osc.stop(end + 0.05);

  activeStop = () => {
    try {
      master.gain.cancelScheduledValues(ac.currentTime);
      master.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.08);
      osc.stop(ac.currentTime + 0.1);
    } catch {
      /* noop */
    }
    activeStop = null;
  };
}

export function stopLeakAlert() {
  if (activeStop) activeStop();
}
