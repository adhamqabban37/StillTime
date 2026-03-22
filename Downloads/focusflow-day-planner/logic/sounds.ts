// Completion sound using Web Audio API
// Creates a pleasant "ding" sound without external files

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
  }
  return audioContext;
}

export function playCompletionSound() {
  try {
    const ctx = getAudioContext();

    // Resume context if suspended (required for some browsers)
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const now = ctx.currentTime;

    // Create oscillator for the main tone
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Pleasant "ding" frequency
    oscillator.frequency.setValueAtTime(880, now); // A5
    oscillator.frequency.setValueAtTime(1108.73, now + 0.1); // C#6
    oscillator.type = "sine";

    // Envelope - quick attack, medium decay
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.3, now + 0.02); // Quick attack
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5); // Decay

    oscillator.start(now);
    oscillator.stop(now + 0.5);

    // Add a subtle second tone for richness
    const oscillator2 = ctx.createOscillator();
    const gainNode2 = ctx.createGain();

    oscillator2.connect(gainNode2);
    gainNode2.connect(ctx.destination);

    oscillator2.frequency.setValueAtTime(1318.51, now + 0.05); // E6
    oscillator2.type = "sine";

    gainNode2.gain.setValueAtTime(0, now + 0.05);
    gainNode2.gain.linearRampToValueAtTime(0.15, now + 0.07);
    gainNode2.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

    oscillator2.start(now + 0.05);
    oscillator2.stop(now + 0.5);
  } catch (error) {
    console.log("Audio not available:", error);
  }
}
