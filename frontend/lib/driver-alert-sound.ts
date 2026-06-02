"use client";

let audioContext: AudioContext | null = null;

function getAudioContext() {
  if (typeof window === "undefined") {
    return null;
  }

  const AudioContextCtor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

  if (!AudioContextCtor) {
    return null;
  }

  audioContext ??= new AudioContextCtor();
  return audioContext;
}

export async function primeDriverAlertSound() {
  const context = getAudioContext();

  if (!context || context.state !== "suspended") {
    return;
  }

  await context.resume();
}

export function playIncomingRideSound() {
  const context = getAudioContext();

  if (!context) {
    return;
  }

  if (context.state === "suspended") {
    void context.resume().catch(() => undefined);
  }

  const startAt = context.currentTime + 0.03;
  const tones = [
    { delay: 0, frequency: 880 },
    { delay: 0.18, frequency: 1046 },
    { delay: 0.36, frequency: 880 }
  ];

  tones.forEach((tone) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const toneStart = startAt + tone.delay;
    const toneEnd = toneStart + 0.12;

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(tone.frequency, toneStart);
    gain.gain.setValueAtTime(0.0001, toneStart);
    gain.gain.exponentialRampToValueAtTime(0.18, toneStart + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, toneEnd);

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(toneStart);
    oscillator.stop(toneEnd + 0.03);
  });
}
