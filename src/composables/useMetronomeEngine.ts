import { onBeforeUnmount, ref, watch, type Ref } from "vue";
import {
  subdivisionPatterns,
  type NoteSubdivisionId,
} from "../types/subdivision";

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
  beatsPerMeasure: number;
};

export function useMetronomeEngine(options: UseMetronomeEngineOptions) {
  const { bpm, selectedSubdivisionId, beatsPerMeasure } = options;
  const isPlaying = ref(false);
  const currentBeat = ref<number | null>(null);
  const glowPulseActive = ref(false);
  const playbackSubdivisionId = ref<NoteSubdivisionId>(
    selectedSubdivisionId.value,
  );

  let audioContext: AudioContext | null = null;
  let nextNoteTime = 0;
  let currentPulseIndex = 0;
  let schedulerTimer: ReturnType<typeof setInterval> | undefined;
  let glowPulseTimer: ReturnType<typeof setTimeout> | undefined;

  const lookahead = 25;
  const scheduleAheadTime = 0.1;

  function ensureAudioContext() {
    if (!audioContext) {
      audioContext = new window.AudioContext();
    }

    return audioContext;
  }

  async function warmupAudioContext() {
    const context = ensureAudioContext();

    if (context.state === "suspended") {
      await context.resume();
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

  function getPulseMeta(pulseIndex: number): PulseMeta {
    const pattern = subdivisionPatterns[playbackSubdivisionId.value];
    const pulsesPerMeasure = beatsPerMeasure * pattern.pulsesPerBeat;
    const normalizedPulseIndex =
      ((pulseIndex % pulsesPerMeasure) + pulsesPerMeasure) % pulsesPerMeasure;
    const beat = Math.floor(normalizedPulseIndex / pattern.pulsesPerBeat);
    const pulseInBeat = normalizedPulseIndex % pattern.pulsesPerBeat;

    return {
      beat,
      pulseInBeat,
      isActivePulse: pattern.activePulseIndexes.includes(pulseInBeat),
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

    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(
      meta.isMeasureStart ? 1360 : meta.isBeatStart ? 1040 : 820,
      time,
    );

    gainNode.gain.setValueAtTime(0.0001, time);
    gainNode.gain.exponentialRampToValueAtTime(
      meta.isMeasureStart ? 0.28 : meta.isBeatStart ? 0.2 : 0.12,
      time + 0.004,
    );
    gainNode.gain.exponentialRampToValueAtTime(0.0001, time + 0.06);

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    oscillator.start(time);
    oscillator.stop(time + 0.07);
  }

  function scheduleBeat() {
    while (
      audioContext &&
      nextNoteTime < audioContext.currentTime + scheduleAheadTime
    ) {
      const meta = getPulseMeta(currentPulseIndex);

      if (meta.isBeatStart) {
        scheduleVisualBeat(meta.beat, nextNoteTime);
      }

      if (meta.isActivePulse) {
        playClick(meta, nextNoteTime);
      }

      advancePulse();
    }
  }

  async function startMetronome() {
    const context = await warmupAudioContext();

    syncSubdivisionNow();
    currentPulseIndex = 0;
    currentBeat.value = 0;
    isPlaying.value = true;
    triggerGlowPulse();

    const startTime = context.currentTime;
    playClick(getPulseMeta(0), startTime);
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
