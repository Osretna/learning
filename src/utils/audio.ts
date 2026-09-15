// Synthesized sound effects using the Web Audio API (works offline, zero dependencies)

class SoundEngine {
  private ctx: AudioContext | null = null;

  private init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
  }

  // Pleasant high bell tone for correct answers
  playCorrect() {
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, this.ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.35);
    } catch (e) {
      // Audio autoplay policy fallback
    }
  }

  // Gentle low tone for incorrect answers with encouraging vibe
  playIncorrect() {
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(260, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(180, this.ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.3);
    } catch (e) {}
  }

  // Triumphant fanfare for quiz completion
  playTrophy() {
    try {
      this.init();
      if (!this.ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C, E, G, High C
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        const start = this.ctx!.currentTime + idx * 0.1;
        gain.gain.setValueAtTime(0.18, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.25);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(start);
        osc.stop(start + 0.25);
      });
    } catch (e) {}
  }
}

export const sound = new SoundEngine();

let currentChunks: string[] = [];
let currentChunkIndex = 0;
let isCurrentlySpeaking = false;
let currentOnEndCallback: (() => void) | undefined;
let speechRate = 1.0;

// Speech Synthesis Helper with robust sentence chunking for Arabic and other languages
export function speakText(
  text: string, 
  onEnd?: () => void,
  rate: number = 1.0
): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;

  stopSpeaking();
  speechRate = rate;

  // Clean markdown and formatting symbols
  const clean = text
    .replace(/[#*_`$]/g, '')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/\{.*?\}/g, '')
    .replace(/---/g, '')
    .trim();

  if (!clean) {
    if (onEnd) onEnd();
    return false;
  }

  // Split into manageable sentence chunks (around 120-180 chars max per chunk)
  // so browser speech synthesis never times out or freezes
  const rawSentences = clean.split(/([.؟!:\n]+)/);
  const chunks: string[] = [];
  let buffer = '';

  for (let i = 0; i < rawSentences.length; i++) {
    const part = rawSentences[i];
    if (!part) continue;
    if (buffer.length + part.length < 140) {
      buffer += part;
    } else {
      if (buffer.trim()) chunks.push(buffer.trim());
      buffer = part;
    }
  }
  if (buffer.trim()) chunks.push(buffer.trim());

  if (chunks.length === 0) {
    chunks.push(clean.slice(0, 200));
  }

  currentChunks = chunks;
  currentChunkIndex = 0;
  isCurrentlySpeaking = true;
  currentOnEndCallback = onEnd;

  playNextChunk();
  return true;
}

function playNextChunk() {
  if (!isCurrentlySpeaking) return;

  if (currentChunkIndex >= currentChunks.length) {
    isCurrentlySpeaking = false;
    currentChunks = [];
    currentChunkIndex = 0;
    if (currentOnEndCallback) currentOnEndCallback();
    return;
  }

  const chunk = currentChunks[currentChunkIndex];
  const isArabic = /[\u0600-\u06FF]/.test(chunk);

  const utterance = new SpeechSynthesisUtterance(chunk);
  utterance.lang = isArabic ? 'ar-SA' : 'en-US';
  utterance.rate = (isArabic ? 0.95 : 1.0) * speechRate;

  // Try to find native or preferred voice
  const voices = window.speechSynthesis.getVoices();
  const voice = voices.find(v => v.lang.toLowerCase().startsWith(isArabic ? 'ar' : 'en'));
  if (voice) utterance.voice = voice;

  utterance.onend = () => {
    currentChunkIndex++;
    playNextChunk();
  };

  utterance.onerror = (e) => {
    console.warn('Speech chunk error:', e);
    currentChunkIndex++;
    playNextChunk();
  };

  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  isCurrentlySpeaking = false;
  currentChunks = [];
  currentChunkIndex = 0;
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  if (currentOnEndCallback) {
    const cb = currentOnEndCallback;
    currentOnEndCallback = undefined;
    cb();
  }
}

export function isAudioSpeaking(): boolean {
  return isCurrentlySpeaking;
}

