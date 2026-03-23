import { onBeforeUnmount, ref, watch, type Ref } from "vue";
import countAUrl from "../assets/count-voice/a.mp3?url";
import countAndUrl from "../assets/count-voice/and.mp3?url";
import countEUrl from "../assets/count-voice/e.mp3?url";
import countEightUrl from "../assets/count-voice/eight.mp3?url";
import countElevenUrl from "../assets/count-voice/eleven.mp3?url";
import countFiveUrl from "../assets/count-voice/five.mp3?url";
import countFourUrl from "../assets/count-voice/four.mp3?url";
import countNineUrl from "../assets/count-voice/nine.mp3?url";
import countOneUrl from "../assets/count-voice/one.mp3?url";
import countSevenUrl from "../assets/count-voice/seven.mp3?url";
import countSixUrl from "../assets/count-voice/six.mp3?url";
import countTenUrl from "../assets/count-voice/ten.mp3?url";
import countThirteenUrl from "../assets/count-voice/thirteen.mp3?url";
import countThreeUrl from "../assets/count-voice/three.mp3?url";
import countTwelveUrl from "../assets/count-voice/twelve.mp3?url";
import countTwoUrl from "../assets/count-voice/two.mp3?url";
import {
  subdivisionPatterns,
  type NoteSubdivisionId,
} from "../types/subdivision";
import type { SoundPackId } from "../types/sound-pack";

type PulseMeta = {
  beat: number;
  pulseInBeat: number;
  isActivePulse: boolean;
  isBeatStart: boolean;
  isMeasureStart: boolean;
};

const countNumberKeys = [
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "thirteen",
] as const;

type CountNumberKey = (typeof countNumberKeys)[number];
type CountSyllableKey = CountNumberKey | "and" | "e" | "a";
type CountVoiceClip = {
  buffer: AudioBuffer;
  onsetLeadSeconds: number;
  gainBoost: number;
};

const countVoiceClipUrls: Record<CountSyllableKey, string> = {
  one: countOneUrl,
  two: countTwoUrl,
  three: countThreeUrl,
  four: countFourUrl,
  five: countFiveUrl,
  six: countSixUrl,
  seven: countSevenUrl,
  eight: countEightUrl,
  nine: countNineUrl,
  ten: countTenUrl,
  eleven: countElevenUrl,
  twelve: countTwelveUrl,
  thirteen: countThirteenUrl,
  and: countAndUrl,
  e: countEUrl,
  a: countAUrl,
};

const countVoiceLeadOverrides: Partial<Record<CountSyllableKey, number>> = {
  four: 0.175,
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
  let countVoiceBuffers: Partial<Record<CountSyllableKey, CountVoiceClip>> = {};
  let countVoiceReady = false;
  let countVoiceLoadingPromise: Promise<void> | null = null;

  const lookahead = 25;
  const scheduleAheadTime = 0.1;
  const engineStartLeadTimeSeconds = 0.02;
  const countVoiceBaseGain = 0.52;
  const countVoiceExtraBoost = 1.85;
  const metronomeLoudnessBoost = 1.58;

  function getScheduleAheadTime() {
    return isCountSpeechPackActive() ? 0.26 : scheduleAheadTime;
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

  async function warmupAudioContext() {
    const context = ensureAudioContext();

    if (context.state === "suspended") {
      await context.resume();
    }

    return context;
  }

  function getCountPulsesPerBeat() {
    return subdivisionPatterns[playbackSubdivisionId.value].pulsesPerBeat;
  }

  function isCountSpeechPackActive() {
    return playbackSoundPackId.value === "count-one-e-and-e";
  }

  function getBeatNumberKey(beat: number): CountNumberKey {
    const normalized = Math.max(0, Math.min(beat, countNumberKeys.length - 1));
    return countNumberKeys[normalized];
  }

  function detectOnsetLeadSeconds(buffer: AudioBuffer) {
    const channel = buffer.getChannelData(0);
    let maxAbs = 0;

    for (let i = 0; i < channel.length; i += 1) {
      const sampleAbs = Math.abs(channel[i]);
      if (sampleAbs > maxAbs) {
        maxAbs = sampleAbs;
      }
    }

    const threshold = Math.max(0.006, maxAbs * 0.065);
    let onsetIndex = 0;

    for (let i = 0; i < channel.length; i += 1) {
      if (Math.abs(channel[i]) >= threshold) {
        onsetIndex = i;
        break;
      }
    }

    const detected = onsetIndex / buffer.sampleRate;
    return Math.max(0, Math.min(0.26, detected));
  }

  function detectPeakAmplitude(buffer: AudioBuffer) {
    const channel = buffer.getChannelData(0);
    let peak = 0;

    for (let i = 0; i < channel.length; i += 1) {
      const absSample = Math.abs(channel[i]);
      if (absSample > peak) {
        peak = absSample;
      }
    }

    return peak;
  }

  async function ensureCountVoiceBuffers(context: AudioContext) {
    if (countVoiceReady) {
      return;
    }

    if (countVoiceLoadingPromise) {
      return countVoiceLoadingPromise;
    }

    countVoiceLoadingPromise = (async () => {
      const loadedBuffers: Partial<Record<CountSyllableKey, CountVoiceClip>> = {};
      const entries = Object.entries(countVoiceClipUrls) as Array<
        [CountSyllableKey, string]
      >;

      await Promise.all(
        entries.map(async ([key, url]) => {
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(`Failed to load clip: ${key}`);
          }

          const encodedData = await response.arrayBuffer();
          // decodeAudioData may detach the input; clone to avoid reuse issues.
          const decoded = await context.decodeAudioData(encodedData.slice(0));
          const onsetLeadSeconds =
            detectOnsetLeadSeconds(decoded) + (countVoiceLeadOverrides[key] ?? 0);
          const peakAmplitude = detectPeakAmplitude(decoded);
          const gainBoost = Math.min(4, Math.max(1, 0.5 / Math.max(0.0001, peakAmplitude)));
          loadedBuffers[key] = {
            buffer: decoded,
            onsetLeadSeconds,
            gainBoost,
          };
        }),
      );

      countVoiceBuffers = loadedBuffers;
      countVoiceReady = true;
      countVoiceLoadingPromise = null;
    })().catch((error) => {
      countVoiceLoadingPromise = null;
      throw error;
    });

    return countVoiceLoadingPromise;
  }

  function getSecondsPerPulse() {
    const pattern = subdivisionPatterns[playbackSubdivisionId.value];
    const pulsesPerBeat = isCountSpeechPackActive()
      ? getCountPulsesPerBeat()
      : pattern.pulsesPerBeat;
    return 60 / bpm.value / pulsesPerBeat;
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
  }

  function getPulseMeta(pulseIndex: number): PulseMeta {
    const pattern = subdivisionPatterns[playbackSubdivisionId.value];
    const pulsesPerBeat = isCountSpeechPackActive()
      ? getCountPulsesPerBeat()
      : pattern.pulsesPerBeat;
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

  function getCountSyllableKey(meta: PulseMeta): CountSyllableKey {
    const pulsesPerBeat = getCountPulsesPerBeat();

    if (pulsesPerBeat <= 1) {
      return getBeatNumberKey(meta.beat);
    }

    if (pulsesPerBeat === 2) {
      return meta.pulseInBeat === 0 ? getBeatNumberKey(meta.beat) : "and";
    }

    if (pulsesPerBeat === 4) {
      if (meta.pulseInBeat === 0) {
        return getBeatNumberKey(meta.beat);
      }

      if (meta.pulseInBeat === 1) {
        return "e";
      }

      if (meta.pulseInBeat === 2) {
        return "and";
      }

      return "a";
    }

    if (meta.pulseInBeat === 0) {
      return getBeatNumberKey(meta.beat);
    }

    return meta.pulseInBeat === pulsesPerBeat - 1 ? "a" : "and";
  }

  function scheduleVisualBeat(beat: number, time: number) {
    const context = ensureAudioContext();
    const delay = Math.max(0, time - context.currentTime) * 1000;

    window.setTimeout(() => {
      currentBeat.value = beat;
      triggerGlowPulse();
    }, delay);
  }

  function playCountVoice(meta: PulseMeta, time: number, context: AudioContext) {
    const clip = countVoiceBuffers[getCountSyllableKey(meta)];
    if (!clip) {
      return;
    }

    const { buffer, onsetLeadSeconds, gainBoost } = clip;
    const source = context.createBufferSource();
    const gainNode = context.createGain();
    const toneFilter = context.createBiquadFilter();
    const accentLevel = meta.isMeasureStart ? 1 : meta.isBeatStart ? 0.86 : 0.66;
    const masterVolume = getMasterVolume();
    const pulseSeconds = getSecondsPerPulse();
    const pulsesPerBeat = getCountPulsesPerBeat();
    const maxPlaybackRate =
      pulsesPerBeat >= 4 ? 2.15 : pulsesPerBeat === 2 ? 1.7 : 1.28;
    const maxLeadByPulse = Math.max(0, pulseSeconds * 0.78);
    const effectiveLeadSeconds = Math.min(onsetLeadSeconds, maxLeadByPulse);
    const startTime = Math.max(
      context.currentTime + 0.001,
      time - effectiveLeadSeconds,
    );
    const playbackRate = Math.min(
      maxPlaybackRate,
      Math.max(1, buffer.duration / Math.max(0.05, pulseSeconds * 0.92)),
    );
    const scaledDuration = buffer.duration / playbackRate;
    const naturalEndTime = startTime + scaledDuration * 0.92;
    const pulseGateEndTime = time + pulseSeconds * 0.985;
    const envelopeEndTime = Math.max(
      startTime + 0.03,
      Math.min(naturalEndTime, pulseGateEndTime),
    );

    source.buffer = buffer;
    source.playbackRate.setValueAtTime(playbackRate, startTime);
    toneFilter.type = "lowpass";
    toneFilter.Q.setValueAtTime(0.65, startTime);
    toneFilter.frequency.setValueAtTime(
      pulsesPerBeat >= 4 ? 1850 : pulsesPerBeat === 2 ? 2450 : 3200,
      startTime,
    );
    gainNode.gain.setValueAtTime(0.0001, startTime);
    gainNode.gain.exponentialRampToValueAtTime(
      getScaledGain(
        countVoiceBaseGain * countVoiceExtraBoost * gainBoost * accentLevel,
        masterVolume,
      ),
      startTime + 0.003,
    );
    gainNode.gain.exponentialRampToValueAtTime(
      0.0001,
      envelopeEndTime,
    );

    source.connect(gainNode);
    gainNode.connect(toneFilter);
    toneFilter.connect(context.destination);
    source.start(startTime);
    source.stop(envelopeEndTime + 0.012);
  }

  function playClick(meta: PulseMeta, time: number) {
    const context = ensureAudioContext();

    if (isCountSpeechPackActive()) {
      playCountVoice(meta, time, context);
      return;
    }

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
        playClick(meta, nextNoteTime);
      }

      advancePulse();
    }
  }

  async function startMetronome() {
    const context = await warmupAudioContext();

    if (isCountSpeechPackActive()) {
      await ensureCountVoiceBuffers(context);
    }

    syncSubdivisionNow();
    currentPulseIndex = 0;
    currentBeat.value = 0;
    isPlaying.value = true;

    const startTime = context.currentTime + engineStartLeadTimeSeconds;

    scheduleVisualBeat(0, startTime);
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

  watch(selectedSoundPackId, () => {
    syncSoundPackNow();

    if (selectedSoundPackId.value === "count-one-e-and-e") {
      void warmupAudioContext()
        .then((context) => ensureCountVoiceBuffers(context))
        .catch(() => {
          // Ignore preload failures; playback path will throw if still unavailable.
        });
    }
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
