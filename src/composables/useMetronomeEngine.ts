import { onBeforeUnmount, ref, watch, type Ref } from "vue";
import {
  subdivisionPatterns,
  type NoteSubdivisionId,
} from "../types/subdivision";
import type { SoundPackId } from "../types/sound-pack";
import voiceCountOneUrl from "../assets/count-voice/equal/one.wav";
import voiceCountTwoUrl from "../assets/count-voice/equal/two.wav";
import voiceCountThreeUrl from "../assets/count-voice/equal/three.wav";
import voiceCountFourUrl from "../assets/count-voice/equal/four.wav";

type PulseMeta = {
  beat: number;
  pulseInBeat: number;
  isActivePulse: boolean;
  isBeatStart: boolean;
  isMeasureStart: boolean;
};

type UseMetronomeEngineOptions = {
  bpm: Ref<number>;
  selectedSubdivisionId: Ref<NoteSubdivisionId>;
  selectedSoundPackId: Ref<SoundPackId>;
  beatsPerMeasure: Ref<number>;
  beatUnitDenominator: Ref<number>;
  metronomeVolume: Ref<number>;
};

export function useMetronomeEngine(options: UseMetronomeEngineOptions) {
  const {
    bpm,
    selectedSubdivisionId,
    selectedSoundPackId,
    beatsPerMeasure,
    beatUnitDenominator,
    metronomeVolume,
  } = options;
  const isPlaying = ref(false);
  const currentBeat = ref<number | null>(null);
  const glowPulseActive = ref(false);
  const playbackSubdivisionId = ref<NoteSubdivisionId>(
    selectedSubdivisionId.value,
  );
  const playbackSoundPackId = ref<SoundPackId>(selectedSoundPackId.value);

  let audioContext: AudioContext | null = null;
  let nextNoteTime = 0;
  let currentPulseIndex = 0;
  let schedulerTimer: ReturnType<typeof setInterval> | undefined;
  let glowPulseTimer: ReturnType<typeof setTimeout> | undefined;
  let voiceCountBuffersPromise: Promise<void> | null = null;
  const voiceCountBuffers = new Map<number, AudioBuffer>();

  const lookahead = 25;
  const scheduleAheadTime = 0.1;
  const engineStartLeadTimeSeconds = 0.02;
  const metronomeLoudnessBoost = 1.58;
  const voiceCountLeadInSeconds = 0.012;
  const voiceCountClipUrls = new Map<number, string>([
    [1, voiceCountOneUrl],
    [2, voiceCountTwoUrl],
    [3, voiceCountThreeUrl],
    [4, voiceCountFourUrl],
  ]);

  function getScheduleAheadTime() {
    return scheduleAheadTime;
  }

  function getMasterVolume() {
    return Math.min(1, Math.max(0, metronomeVolume.value));
  }

  function getScaledGain(baseGain: number, masterVolume: number) {
    return Math.min(0.98, baseGain * masterVolume * metronomeLoudnessBoost);
  }

  function ensureAudioContext() {
    if (!audioContext) {
      audioContext = new window.AudioContext();
    }

    return audioContext;
  }

  function isVoiceCountSoundPack(soundPackId: SoundPackId) {
    return soundPackId === "voice-count-female";
  }

  function getVoiceCountBeatNumber(beat: number) {
    return (beat % 4) + 1;
  }

  async function ensureVoiceCountBuffersLoaded(context: AudioContext) {
    if (voiceCountBuffers.size === voiceCountClipUrls.size) {
      return;
    }

    if (!voiceCountBuffersPromise) {
      voiceCountBuffersPromise = Promise.all(
        Array.from(voiceCountClipUrls.entries()).map(async ([beat, clipUrl]) => {
          const response = await fetch(clipUrl);
          const clipArrayBuffer = await response.arrayBuffer();
          const audioBuffer = await context.decodeAudioData(clipArrayBuffer);
          voiceCountBuffers.set(beat, audioBuffer);
        }),
      )
        .then(() => undefined)
        .finally(() => {
          voiceCountBuffersPromise = null;
        });
    }

    await voiceCountBuffersPromise;
  }

  async function warmupAudioContext() {
    const context = ensureAudioContext();

    if (context.state === "suspended") {
      await context.resume();
    }

    if (isVoiceCountSoundPack(selectedSoundPackId.value)) {
      await ensureVoiceCountBuffersLoaded(context);
    }

    return context;
  }

  function getSecondsPerPulse() {
    const pattern = subdivisionPatterns[playbackSubdivisionId.value];
    return 60 / bpm.value / pattern.pulsesPerBeat;
  }

  function syncSubdivisionNow(options?: { resetTimeline?: boolean }) {
    playbackSubdivisionId.value = selectedSubdivisionId.value;

    if (options?.resetTimeline && audioContext) {
      currentPulseIndex = 0;
      currentBeat.value = 0;
      nextNoteTime = audioContext.currentTime + 0.06;
    }
  }

  function syncSoundPackNow() {
    playbackSoundPackId.value = selectedSoundPackId.value;

    if (audioContext && isVoiceCountSoundPack(playbackSoundPackId.value)) {
      void ensureVoiceCountBuffersLoaded(audioContext).catch(() => {
        // Keep the transport responsive even if the voice assets fail to load.
      });
    }
  }

  function getPulseMeta(pulseIndex: number): PulseMeta {
    const pattern = subdivisionPatterns[playbackSubdivisionId.value];
    const pulsesPerBeat = pattern.pulsesPerBeat;
    const pulsesPerMeasure = beatsPerMeasure.value * pulsesPerBeat;
    const normalizedPulseIndex =
      ((pulseIndex % pulsesPerMeasure) + pulsesPerMeasure) % pulsesPerMeasure;
    const beat = Math.floor(normalizedPulseIndex / pulsesPerBeat);
    const pulseInBeat = normalizedPulseIndex % pulsesPerBeat;
    const isActivePulse = pattern.activePulseIndexes.includes(pulseInBeat);

    return {
      beat,
      pulseInBeat,
      isActivePulse,
      isBeatStart: pulseInBeat === 0,
      isMeasureStart: beat === 0 && pulseInBeat === 0,
    };
  }

  function advancePulse() {
    nextNoteTime += getSecondsPerPulse();
    currentPulseIndex += 1;
  }

  function triggerGlowPulse() {
    glowPulseActive.value = false;

    if (glowPulseTimer) {
      clearTimeout(glowPulseTimer);
    }

    window.requestAnimationFrame(() => {
      glowPulseActive.value = true;
    });

    glowPulseTimer = window.setTimeout(() => {
      glowPulseActive.value = false;
    }, 190);
  }

  function scheduleVisualBeat(beat: number, time: number) {
    const context = ensureAudioContext();
    const delay = Math.max(0, time - context.currentTime) * 1000;

    window.setTimeout(() => {
      currentBeat.value = beat;
      triggerGlowPulse();
    }, delay);
  }

  function playClick(meta: PulseMeta, time: number) {
    const context = ensureAudioContext();
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    const accentLevel = meta.isMeasureStart ? 1 : meta.isBeatStart ? 0.82 : 0.6;
    const masterVolume = getMasterVolume();

    if (playbackSoundPackId.value === "studio-click") {
      oscillator.type = "triangle";
      oscillator.frequency.setValueAtTime(
        meta.isMeasureStart ? 1400 : meta.isBeatStart ? 1060 : 840,
        time,
      );
      gainNode.gain.setValueAtTime(0.0001, time);
      gainNode.gain.exponentialRampToValueAtTime(
        getScaledGain(0.26 * accentLevel, masterVolume),
        time + 0.003,
      );
      gainNode.gain.exponentialRampToValueAtTime(0.0001, time + 0.06);
    } else if (playbackSoundPackId.value === "wood-block") {
      oscillator.type = "square";
      oscillator.frequency.setValueAtTime(
        meta.isMeasureStart ? 920 : meta.isBeatStart ? 760 : 620,
        time,
      );
      gainNode.gain.setValueAtTime(0.0001, time);
      gainNode.gain.exponentialRampToValueAtTime(
        getScaledGain(0.2 * accentLevel, masterVolume),
        time + 0.002,
      );
      gainNode.gain.exponentialRampToValueAtTime(0.0001, time + 0.045);
    } else if (playbackSoundPackId.value === "analog-pulse") {
      oscillator.type = "sawtooth";
      oscillator.frequency.setValueAtTime(
        meta.isMeasureStart ? 780 : meta.isBeatStart ? 620 : 520,
        time,
      );
      oscillator.frequency.exponentialRampToValueAtTime(
        meta.isMeasureStart ? 560 : meta.isBeatStart ? 460 : 390,
        time + 0.08,
      );
      gainNode.gain.setValueAtTime(0.0001, time);
      gainNode.gain.exponentialRampToValueAtTime(
        getScaledGain(0.18 * accentLevel, masterVolume),
        time + 0.006,
      );
      gainNode.gain.exponentialRampToValueAtTime(0.0001, time + 0.11);
    } else if (playbackSoundPackId.value === "shaker-tick") {
      oscillator.type = "square";
      oscillator.frequency.setValueAtTime(
        meta.isMeasureStart ? 2500 : meta.isBeatStart ? 2200 : 1900,
        time,
      );
      gainNode.gain.setValueAtTime(0.0001, time);
      gainNode.gain.exponentialRampToValueAtTime(
        getScaledGain(0.1 * accentLevel, masterVolume),
        time + 0.0018,
      );
      gainNode.gain.exponentialRampToValueAtTime(0.0001, time + 0.028);
    }

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    oscillator.start(time);
    oscillator.stop(time + 0.12);
  }

  function playVoiceCount(meta: PulseMeta, time: number) {
    if (playbackSubdivisionId.value !== "quarter" || !meta.isBeatStart || !audioContext) {
      return false;
    }

    const clipBeatNumber = getVoiceCountBeatNumber(meta.beat);
    const clipBuffer = voiceCountBuffers.get(clipBeatNumber);

    if (!clipBuffer) {
      return false;
    }

    const sourceNode = audioContext.createBufferSource();
    const gainNode = audioContext.createGain();

    sourceNode.buffer = clipBuffer;
    gainNode.gain.setValueAtTime(getMasterVolume(), time);

    sourceNode.connect(gainNode);
    gainNode.connect(audioContext.destination);

    sourceNode.start(Math.max(audioContext.currentTime, time - voiceCountLeadInSeconds));
    return true;
  }

  function playPulse(meta: PulseMeta, time: number) {
    if (
      isVoiceCountSoundPack(playbackSoundPackId.value) &&
      playVoiceCount(meta, time)
    ) {
      return;
    }

    playClick(meta, time);
  }

  function scheduleBeat() {
    while (
      audioContext &&
      nextNoteTime < audioContext.currentTime + getScheduleAheadTime()
    ) {
      const meta = getPulseMeta(currentPulseIndex);

      if (meta.isBeatStart) {
        scheduleVisualBeat(meta.beat, nextNoteTime);
      }

      if (meta.isActivePulse) {
        playPulse(meta, nextNoteTime);
      }

      advancePulse();
    }
  }

  async function startMetronome() {
    const context = await warmupAudioContext();

    if (isVoiceCountSoundPack(playbackSoundPackId.value)) {
      await ensureVoiceCountBuffersLoaded(context);
    }

    syncSubdivisionNow();
    currentPulseIndex = 0;
    currentBeat.value = 0;
    isPlaying.value = true;

    const startTime = context.currentTime + engineStartLeadTimeSeconds;

    scheduleVisualBeat(0, startTime);
    playPulse(getPulseMeta(0), startTime);
    advancePulse();
    nextNoteTime = startTime + getSecondsPerPulse();

    scheduleBeat();
    schedulerTimer = window.setInterval(scheduleBeat, lookahead);
  }

  function stopMetronome() {
    if (schedulerTimer) {
      clearInterval(schedulerTimer);
      schedulerTimer = undefined;
    }

    if (glowPulseTimer) {
      clearTimeout(glowPulseTimer);
      glowPulseTimer = undefined;
    }

    isPlaying.value = false;
    currentPulseIndex = 0;
    currentBeat.value = null;
    glowPulseActive.value = false;
  }

  async function togglePlayback() {
    if (isPlaying.value) {
      stopMetronome();
      return;
    }

    await startMetronome();
  }

  watch(bpm, () => {
    if (isPlaying.value && audioContext) {
      nextNoteTime = audioContext.currentTime + 0.06;
    }
  });

  watch(selectedSubdivisionId, () => {
    if (isPlaying.value && audioContext) {
      syncSubdivisionNow({ resetTimeline: true });
      return;
    }

    syncSubdivisionNow();
  });

  watch(selectedSoundPackId, () => {
    syncSoundPackNow();
  });

  watch(beatsPerMeasure, () => {
    if (isPlaying.value && audioContext) {
      currentPulseIndex = 0;
      currentBeat.value = 0;
      nextNoteTime = audioContext.currentTime + 0.06;
    }
  });

  watch(beatUnitDenominator, () => {
    if (isPlaying.value && audioContext) {
      currentPulseIndex = 0;
      currentBeat.value = 0;
      nextNoteTime = audioContext.currentTime + 0.06;
    }
  });

  onBeforeUnmount(() => {
    stopMetronome();

    if (audioContext) {
      void audioContext.close();
    }
  });

  return {
    currentBeat,
    glowPulseActive,
    isPlaying,
    syncSubdivisionNow,
    togglePlayback,
    warmupAudioContext,
  };
}
