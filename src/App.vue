<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import SplashIntro from "./components/SplashIntro.vue";

type NoteSubdivisionOption = {
  id: string;
  symbol: string;
  label: string;
};

const bpm = ref(96);
const isPlaying = ref(false);
const currentBeat = ref<number | null>(null);
const beatsPerMeasure = 4;

const timeSignature = ref("4/4");
const soundPack = ref("Studio Click");
const accentPattern = ref("强-弱-弱-弱");
const subdivisionMenuOpen = ref(false);

const subdivisionOptions: NoteSubdivisionOption[] = [
  { id: "quarter", symbol: "♩", label: "4分音符" },
  { id: "eighth", symbol: "♪ ♪", label: "8分音符" },
  { id: "eighth-triplet", symbol: "♪ ♪ ♪", label: "8分音 3连音" },
  {
    id: "eighth-triplet-rest",
    symbol: "♪ · ♪",
    label: "8分音符 3连音中间空一拍",
  },
  { id: "sixteenth", symbol: "♬", label: "16分音符" },
  { id: "sixteenth-rest", symbol: "♬ · ·", label: "16分音符中间空两拍" },
];

const selectedSubdivisionId = ref(subdivisionOptions[0].id);

const showSplash = ref(true);

const quickPresets = [
  { label: "热身", bpm: 72, detail: "舒展手指，慢速进入状态" },
  { label: "基础", bpm: 96, detail: "日常练习的稳定速度" },
  { label: "冲刺", bpm: 120, detail: "提升控制与耐力" },
];

const beatDots = computed(() =>
  Array.from({ length: beatsPerMeasure }, (_, index) => ({
    id: index,
    active: index === currentBeat.value,
  })),
);

const selectedSubdivision = computed(
  () =>
    subdivisionOptions.find(
      (option) => option.id === selectedSubdivisionId.value,
    ) ?? subdivisionOptions[0],
);

const subdivisionDisplay = computed(
  () => `${selectedSubdivision.value.symbol} ${selectedSubdivision.value.label}`,
);

let splashHideTimer: ReturnType<typeof setTimeout> | undefined;
let audioContext: AudioContext | null = null;
let nextNoteTime = 0;
let currentBeatIndex = 0;
let schedulerTimer: ReturnType<typeof setInterval> | undefined;

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

function advanceBeat() {
  const secondsPerBeat = 60 / bpm.value;
  nextNoteTime += secondsPerBeat;
  currentBeatIndex = (currentBeatIndex + 1) % beatsPerMeasure;
}

function scheduleVisualBeat(beat: number, time: number) {
  const context = ensureAudioContext();
  const delay = Math.max(0, time - context.currentTime) * 1000;

  window.setTimeout(() => {
    currentBeat.value = beat;
  }, delay);
}

function playClick(beat: number, time: number) {
  const context = ensureAudioContext();
  const oscillator = context.createOscillator();
  const gainNode = context.createGain();
  const isAccent = beat === 0;

  oscillator.type = "triangle";
  oscillator.frequency.setValueAtTime(isAccent ? 1360 : 920, time);

  gainNode.gain.setValueAtTime(0.0001, time);
  gainNode.gain.exponentialRampToValueAtTime(
    isAccent ? 0.28 : 0.18,
    time + 0.004,
  );
  gainNode.gain.exponentialRampToValueAtTime(0.0001, time + 0.08);

  oscillator.connect(gainNode);
  gainNode.connect(context.destination);

  oscillator.start(time);
  oscillator.stop(time + 0.09);
}

function scheduleBeat() {
  while (
    audioContext &&
    nextNoteTime < audioContext.currentTime + scheduleAheadTime
  ) {
    const beat = currentBeatIndex;
    playClick(beat, nextNoteTime);
    scheduleVisualBeat(beat, nextNoteTime);
    advanceBeat();
  }
}

async function startMetronome() {
  const context = await warmupAudioContext();

  currentBeatIndex = 0;
  currentBeat.value = 0;
  isPlaying.value = true;

  const startTime = context.currentTime;
  playClick(0, startTime);
  advanceBeat();
  nextNoteTime = startTime + 60 / bpm.value;

  scheduleBeat();
  schedulerTimer = window.setInterval(scheduleBeat, lookahead);
}

function stopMetronome() {
  if (schedulerTimer) {
    clearInterval(schedulerTimer);
    schedulerTimer = undefined;
  }

  isPlaying.value = false;
  currentBeatIndex = 0;
  currentBeat.value = null;
}

async function togglePlayback() {
  if (isPlaying.value) {
    stopMetronome();
    return;
  }

  await startMetronome();
}

function nudgeBpm(amount: number) {
  bpm.value = Math.min(240, Math.max(40, bpm.value + amount));
}

function applyPreset(nextBpm: number) {
  bpm.value = nextBpm;
}

function toggleSubdivisionMenu() {
  subdivisionMenuOpen.value = !subdivisionMenuOpen.value;
}

function selectSubdivision(optionId: string) {
  selectedSubdivisionId.value = optionId;
  subdivisionMenuOpen.value = false;
}

watch(bpm, () => {
  if (isPlaying.value && audioContext) {
    nextNoteTime = audioContext.currentTime + 0.06;
  }
});

onMounted(() => {
  void warmupAudioContext().catch(() => {
    // Some runtimes still require a user gesture before audio can fully start.
  });

  splashHideTimer = window.setTimeout(() => {
    showSplash.value = false;
  }, 2400);
});

onBeforeUnmount(() => {
  if (splashHideTimer) {
    clearTimeout(splashHideTimer);
  }

  stopMetronome();

  if (audioContext) {
    void audioContext.close();
  }
});
</script>

<template>
  <main class="page-shell">
    <Transition name="screen-fade" mode="out-in">
      <SplashIntro v-if="showSplash" />

      <section v-else class="meter-stage">
        <div class="meter-display">
          <div class="display-top">
            <span class="tag">{{ timeSignature }}</span>
            <span class="tag">{{ selectedSubdivision.symbol }}</span>
            <span class="tag">{{ soundPack }}</span>
          </div>

          <div class="bpm-block">
            <button class="stepper" type="button" @click="nudgeBpm(-1)">
              -
            </button>
            <div class="bpm-value">
              <span class="bpm-number">{{ bpm }}</span>
              <span class="bpm-unit">BPM</span>
            </div>
            <button class="stepper" type="button" @click="nudgeBpm(1)">
              +
            </button>
          </div>

          <div class="beat-row">
            <span
              v-for="beat in beatDots"
              :key="beat.id"
              :class="['beat-dot', { active: beat.active }]"
            ></span>
          </div>

          <button
            class="transport"
            type="button"
            @pointerdown="void warmupAudioContext()"
            @click="togglePlayback"
          >
            {{ isPlaying ? "暂停" : "开始" }}
          </button>
        </div>

        <aside class="control-panel">
          <div class="panel-section">
            <div class="section-header">
              <h2>当前设置</h2>
              <span class="section-badge">{{
                isPlaying ? "运行中" : "待机"
              }}</span>
            </div>

            <div class="setting-grid">
              <div class="setting-card">
                <span class="setting-label">拍号</span>
                <strong>{{ timeSignature }}</strong>
              </div>
              <div class="setting-card note-setting-card">
                <span class="setting-label">音符</span>
                <button
                  class="note-select-trigger"
                  type="button"
                  @click="toggleSubdivisionMenu"
                >
                  <strong>{{ subdivisionDisplay }}</strong>
                  <span class="note-select-caret">{{
                    subdivisionMenuOpen ? "▲" : "▼"
                  }}</span>
                </button>
              </div>
              <div class="setting-card">
                <span class="setting-label">音色</span>
                <strong>{{ soundPack }}</strong>
              </div>
              <div class="setting-card">
                <span class="setting-label">重音</span>
                <strong>{{ accentPattern }}</strong>
              </div>
            </div>
          </div>

          <div class="panel-section">
            <div class="section-header">
              <h2>快捷预设</h2>
              <span class="section-badge muted">可点击</span>
            </div>

            <div class="preset-list">
              <button
                v-for="preset in quickPresets"
                :key="preset.label"
                class="preset-card"
                type="button"
                @click="applyPreset(preset.bpm)"
              >
                <strong>{{ preset.label }}</strong>
                <span>{{ preset.bpm }} BPM</span>
                <small>{{ preset.detail }}</small>
              </button>
            </div>
          </div>
        </aside>
      </section>
    </Transition>
  </main>

  <Transition name="sheet-fade">
    <div
      v-if="subdivisionMenuOpen"
      class="note-sheet-overlay"
      @click.self="subdivisionMenuOpen = false"
    >
      <Transition name="note-sheet">
        <section v-if="subdivisionMenuOpen" class="note-sheet-panel">
          <div class="note-sheet-header">
            <div>
              <span class="note-sheet-eyebrow">音符选择</span>
              <h3>选择节奏音符</h3>
            </div>
            <button
              class="note-sheet-close"
              type="button"
              @click="subdivisionMenuOpen = false"
            >
              关闭
            </button>
          </div>

          <div class="note-sheet-current">
            当前：{{ subdivisionDisplay }}
          </div>

          <div class="note-select-popup">
            <button
              v-for="option in subdivisionOptions"
              :key="option.id"
              :class="[
                'note-option',
                {
                  active: option.id === selectedSubdivisionId,
                },
              ]"
              type="button"
              @click="selectSubdivision(option.id)"
            >
              <span class="note-option-symbol">{{ option.symbol }}</span>
              <span class="note-option-label">{{ option.label }}</span>
            </button>
          </div>
        </section>
      </Transition>
    </div>
  </Transition>
</template>

<style scoped>
:global(:root) {
  font-family: "Segoe UI", "Microsoft YaHei UI", sans-serif;
  color: #f6edd8;
  background:
    radial-gradient(
      circle at top left,
      rgba(198, 154, 75, 0.2),
      transparent 28%
    ),
    radial-gradient(
      circle at top right,
      rgba(65, 95, 84, 0.18),
      transparent 24%
    ),
    linear-gradient(180deg, #171411 0%, #0f0d0b 100%);
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

:global(html),
:global(body) {
  margin: 0;
  min-width: 320px;
  width: 100%;
  height: 100%;
  overflow: hidden;
  user-select: none;
  -webkit-user-select: none;
}

:global(button),
:global(input) {
  font: inherit;
}

:global(button),
:global([role="button"]),
:global(a),
:global(label[for]) {
  cursor: pointer;
}

:global(#app) {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.page-shell {
  width: 100%;
  height: 100vh;
  padding: 16px;
  display: grid;
  box-sizing: border-box;
  overflow: hidden;
}

.meter-stage {
  width: min(1120px, 100%);
  height: 100%;
  margin: 0 auto;
  display: grid;
  gap: 16px;
  align-content: center;
  grid-template-columns: minmax(0, 1.18fr) minmax(300px, 0.82fr);
  animation: home-enter 720ms cubic-bezier(0.22, 1, 0.36, 1);
}

.meter-display,
.control-panel {
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(24, 21, 18, 0.88);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.26);
}

.meter-display {
  padding: 24px;
  display: grid;
  gap: 20px;
}

.display-top {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag {
  padding: 7px 11px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  color: rgba(246, 237, 216, 0.84);
  font-size: 0.9rem;
}

.bpm-block {
  display: grid;
  grid-template-columns: 60px 1fr 60px;
  align-items: center;
  gap: 14px;
}

.stepper,
.transport,
.preset-card {
  border: 0;
  cursor: pointer;
}

.stepper {
  height: 60px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.06);
  color: #f6edd8;
  font-size: 1.35rem;
}

.bpm-value {
  display: grid;
  justify-items: center;
}

.bpm-number {
  font-size: clamp(4.4rem, 12vw, 7rem);
  line-height: 0.92;
  font-weight: 700;
}

.bpm-unit {
  margin-top: 8px;
  color: rgba(246, 237, 216, 0.65);
  letter-spacing: 0.24em;
  text-transform: uppercase;
  font-size: 0.86rem;
}

.beat-row {
  display: flex;
  justify-content: center;
  gap: 12px;
}

.beat-dot {
  width: 16px;
  height: 16px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.14);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08);
  transition:
    transform 120ms ease,
    background-color 120ms ease,
    box-shadow 120ms ease;
}

.beat-dot.active {
  background: #dfac53;
  transform: scale(1.14);
  box-shadow: 0 0 24px rgba(223, 172, 83, 0.7);
}

.transport {
  justify-self: center;
  min-width: 200px;
  padding: 14px 24px;
  border-radius: 999px;
  background: linear-gradient(135deg, #dfac53, #be7d2e);
  color: #1c140d;
  font-weight: 700;
  font-size: 1rem;
}

.control-panel {
  padding: 20px;
  display: grid;
  gap: 20px;
}

.panel-section {
  display: grid;
  gap: 14px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.section-header h2 {
  margin: 0;
  font-size: 1.08rem;
}

.section-badge,
.section-badge.muted {
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.section-badge {
  color: #dfac53;
}

.section-badge.muted {
  color: rgba(246, 237, 216, 0.46);
}

.setting-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.setting-card,
.preset-card {
  padding: 14px;
  background: rgba(255, 255, 255, 0.04);
}

.setting-card {
  border-radius: 16px;
  display: grid;
  gap: 4px;
}

.note-setting-card {
  position: relative;
}

.setting-label {
  color: rgba(246, 237, 216, 0.56);
  font-size: 0.8rem;
}

.note-select-trigger {
  width: 100%;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  text-align: left;
}

.note-select-trigger strong {
  flex: 1;
  min-width: 0;
  font-size: 0.97rem;
  line-height: 1.45;
}

.note-select-caret {
  color: rgba(246, 237, 216, 0.58);
  font-size: 0.76rem;
}

.note-sheet-overlay {
  position: fixed;
  inset: 0;
  background: rgba(7, 6, 5, 0.58);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 80;
}

.note-sheet-panel {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: min(50vh, 480px);
  padding: 20px 20px 24px;
  border-radius: 28px 28px 0 0;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background:
    linear-gradient(180deg, rgba(31, 26, 20, 0.98), rgba(16, 13, 11, 0.99));
  box-shadow: 0 -18px 48px rgba(0, 0, 0, 0.32);
  display: grid;
  grid-template-rows: auto auto 1fr;
  gap: 14px;
}

.note-sheet-header {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 12px;
}

.note-sheet-eyebrow {
  display: inline-block;
  margin-bottom: 6px;
  color: rgba(246, 237, 216, 0.5);
  font-size: 0.74rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.note-sheet-header h3 {
  margin: 0;
  font-size: 1.1rem;
}

.note-sheet-close {
  padding: 10px 14px;
  border: 0;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  color: #f6edd8;
}

.note-sheet-current {
  color: rgba(246, 237, 216, 0.72);
  font-size: 0.92rem;
}

.note-select-popup {
  min-height: 0;
  overflow-y: auto;
  padding-right: 4px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.note-option {
  padding: 12px 10px;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.03);
  color: #f6edd8;
  display: grid;
  gap: 6px;
  align-content: start;
  text-align: left;
  transition:
    transform 140ms ease,
    border-color 140ms ease,
    background-color 140ms ease;
}

.note-option:hover {
  transform: translateY(-1px);
  border-color: rgba(223, 172, 83, 0.34);
  background: rgba(223, 172, 83, 0.08);
}

.note-option.active {
  border-color: rgba(223, 172, 83, 0.58);
  background: rgba(223, 172, 83, 0.14);
}

.note-option-symbol {
  color: #dfac53;
  font-size: 1.2rem;
  letter-spacing: 0.08em;
  line-height: 1;
}

.note-option-label {
  font-size: 0.78rem;
  line-height: 1.45;
  color: rgba(246, 237, 216, 0.86);
}

.preset-list {
  display: grid;
  gap: 10px;
}

.preset-card {
  border-radius: 16px;
  color: #f6edd8;
  display: grid;
  gap: 3px;
  text-align: left;
}

.preset-card small {
  color: rgba(246, 237, 216, 0.56);
  line-height: 1.4;
}

.screen-fade-enter-active,
.screen-fade-leave-active {
  transition:
    opacity 520ms ease,
    transform 520ms ease;
}

.screen-fade-enter-from,
.screen-fade-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

.note-menu-enter-active,
.note-menu-leave-active {
  transition:
    opacity 180ms ease,
    transform 180ms ease;
}

.note-menu-enter-from,
.note-menu-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.sheet-fade-enter-active,
.sheet-fade-leave-active {
  transition: opacity 180ms ease;
}

.sheet-fade-enter-from,
.sheet-fade-leave-to {
  opacity: 0;
}

.note-sheet-enter-active,
.note-sheet-leave-active {
  transition:
    opacity 220ms ease,
    transform 220ms cubic-bezier(0.22, 1, 0.36, 1);
}

.note-sheet-enter-from,
.note-sheet-leave-to {
  opacity: 0;
  transform: translateY(28px);
}

@keyframes home-enter {
  from {
    opacity: 0;
    transform: translateY(14px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 980px) {
  .meter-stage {
    width: min(100%, 860px);
    grid-template-columns: 1fr;
    align-content: stretch;
  }

  .meter-display,
  .control-panel {
    min-height: 0;
  }
}

@media (max-width: 640px) {
  .page-shell {
    padding: 12px;
  }

  .meter-stage {
    gap: 12px;
    align-content: start;
  }

  .meter-display,
  .control-panel {
    padding: 18px 16px;
    border-radius: 20px;
  }

  .bpm-block {
    grid-template-columns: 52px 1fr 52px;
    gap: 8px;
  }

  .stepper {
    height: 52px;
    border-radius: 16px;
  }

  .setting-grid {
    grid-template-columns: 1fr;
  }

  .note-select-popup {
    grid-template-columns: 1fr;
  }

  .note-sheet-panel {
    height: min(58vh, 560px);
    padding: 18px 16px 22px;
    border-radius: 24px 24px 0 0;
  }
}
</style>
