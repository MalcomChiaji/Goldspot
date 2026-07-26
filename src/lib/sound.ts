/**
 * Web Audio API synth sound generator for price alert notifications.
 */
export function playAlertSound(type: 'HIGH_YIELD' | 'ALERT' | 'SUCCESS' = 'HIGH_YIELD') {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    if (type === 'HIGH_YIELD') {
      // Two-tone high yield trade target hit chime
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';

      osc1.frequency.setValueAtTime(880, ctx.currentTime); // A5
      osc1.frequency.setValueAtTime(1318.51, ctx.currentTime + 0.12); // E6

      osc2.frequency.setValueAtTime(440, ctx.currentTime);
      osc2.frequency.setValueAtTime(659.25, ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.6);
      osc2.stop(ctx.currentTime + 0.6);
    } else {
      // Standard Alert Beep
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(750, ctx.currentTime);
      osc.frequency.setValueAtTime(1000, ctx.currentTime + 0.1);

      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    }
  } catch (e) {
    console.warn('AudioContext sound alert prevented or unsupported:', e);
  }
}
