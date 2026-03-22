<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import SplashIntro from "./components/SplashIntro.vue";

const bpm = ref(96);
const isPlaying = ref(false);
const currentBeat = ref<number | null>(null);
const beatsPerMeasure = 4;

const timeSignature = ref("4/4");
const subdivision = ref("四分音符");
const soundPack = ref("Studio Click");
const accentPattern = ref("强-弱-弱-弱");

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
  gainNode.gain.exponentialRampToValueAtTime(isAccent ? 0.28 : 0.18, time + 0.004);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, time + 0.08);

  oscillator.connect(gainNode);
  gainNode.connect(context.destination);

  oscillator.start(time);
  oscillator.stop(time + 0.09);
}

function scheduleBeat() {
  while (audioContext && nextNoteTime < audioContext.currentTime + scheduleAheadTime) {
    const beat = currentBeatIndex;
    playClick(beat, nextNoteTime);
    scheduleVisualBeat(beat, nextNoteTime);
    advanceBeat();
  }
}

async function startMetronome() {
  const context = ensureAudioContext();

  if (context.state === "suspended") {
    await context.resume();
  }

  currentBeatIndex = 0;
  currentBeat.value = 0;
  nextNoteTime = context.currentTime + 0.06;
  isPlaying.value = true;

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

watch(bpm, () => {
  if (isPlaying.value && audioContext) {
    nextNoteTime = audioContext.currentTime + 0.06;
  }
});

onMounted(() => {
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
            <span class="tag">{{ subdivision }}</span>
            <span class="tag">{{ soundPack }}</span>
          </div>

          <div class="bpm-block">
            <button class="stepper" type="button" @click="nudgeBpm(-1)">-</button>
            <div class="bpm-value">
              <span class="bpm-number">{{ bpm }}</span>
              <span class="bpm-unit">BPM</span>
            </div>
            <button class="stepper" type="button" @click="nudgeBpm(1)">+</button>
          </div>

          <div class="beat-row">
            <span
              v-for="beat in beatDots"
              :key="beat.id"
              :class="['beat-dot', { active: beat.active }]"
            ></span>
          </div>

          <button class="transport" type="button" @click="togglePlayback">
            {{ isPlaying ? "暂停" : "开始" }}
          </button>
        </div>

        <aside class="control-panel">
          <div class="panel-section">
            <div class="section-header">
              <h2>当前设置</h2>
              <span class="section-badge">{{ isPlaying ? "运行中" : "待机" }}</span>
            </div>

            <div class="setting-grid">
              <div class="setting-card">
                <span class="setting-label">拍号</span>
                <strong>{{ timeSignature }}</strong>
              </div>
              <div class="setting-card">
                <span class="setting-label">细分</span>
                <strong>{{ subdivision }}</strong>
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
</template>

<style scoped>
:global(:root) {
  font-family: "Segoe UI", "Microsoft YaHei UI", sans-serif;
  color: #f6edd8;
  background:
    radial-gradient(circle at top left, rgba(198, 154, 75, 0.2), transparent 28%),
    radial-gradient(circle at top right, rgba(65, 95, 84, 0.18), transparent 24%),
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
}

:global(button),
:global(input) {
  font: inherit;
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

.setting-label {
  color: rgba(246, 237, 216, 0.56);
  font-size: 0.8rem;
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
}
</style>
