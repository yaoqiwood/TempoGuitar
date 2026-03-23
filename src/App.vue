<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import NotationGlyph from "./components/NotationGlyph.vue";
import SplashIntro from "./components/SplashIntro.vue";
import SubdivisionPickerSheet from "./components/SubdivisionPickerSheet.vue";
import { useMetronomeEngine } from "./composables/useMetronomeEngine";
import {
  subdivisionOptions,
  type NoteSubdivisionId,
} from "./types/subdivision";

const bpm = ref(96);
const beatsPerMeasure = 4;

const timeSignature = ref("4/4");
const soundPack = ref("Studio Click");
const accentPattern = ref("强-弱-弱-弱");
const subdivisionMenuOpen = ref(false);
const selectedSubdivisionId = ref<NoteSubdivisionId>(subdivisionOptions[0].id);
const showSplash = ref(true);

const {
  currentBeat,
  glowPulseActive,
  isPlaying,
  syncSubdivisionNow,
  togglePlayback,
  warmupAudioContext,
} = useMetronomeEngine({
  bpm,
  selectedSubdivisionId,
  beatsPerMeasure,
});

const quickPresets = [
  { label: "热身", bpm: 72, detail: "舒展手指，慢速进入练习状态" },
  { label: "基础", bpm: 96, detail: "日常练习的稳定速度" },
  { label: "冲刺", bpm: 120, detail: "提升控制力与耐力" },
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

const subdivisionDisplay = computed(() => selectedSubdivision.value.label);
const subdivisionGlowPalette: Record<
  NoteSubdivisionId,
  {
    primary: string;
    secondary: string;
    accent: string;
    shadow: string;
  }
> = {
  quarter: {
    primary: "#ff6b6b",
    secondary: "#ffd166",
    accent: "#7cf29a",
    shadow: "rgba(255, 107, 107, 0.28)",
  },
  eighth: {
    primary: "#ff8a5b",
    secondary: "#ffd93d",
    accent: "#4de2c5",
    shadow: "rgba(255, 138, 91, 0.28)",
  },
  "eighth-triplet": {
    primary: "#ff9f43",
    secondary: "#65d6ff",
    accent: "#8dff8a",
    shadow: "rgba(101, 214, 255, 0.28)",
  },
  "eighth-triplet-rest": {
    primary: "#f6c945",
    secondary: "#54e38e",
    accent: "#4db8ff",
    shadow: "rgba(84, 227, 142, 0.28)",
  },
  sixteenth: {
    primary: "#48c6ef",
    secondary: "#7b61ff",
    accent: "#ff6ec7",
    shadow: "rgba(123, 97, 255, 0.28)",
  },
  "sixteenth-rest": {
    primary: "#32d74b",
    secondary: "#64d2ff",
    accent: "#ffd166",
    shadow: "rgba(50, 215, 75, 0.28)",
  },
};

const stageGlowStyle = computed(() => {
  const palette = subdivisionGlowPalette[selectedSubdivisionId.value];

  return {
    "--glow-primary": palette.primary,
    "--glow-secondary": palette.secondary,
    "--glow-accent": palette.accent,
    "--glow-shadow": palette.shadow,
  };
});

let splashHideTimer: ReturnType<typeof setTimeout> | undefined;

function nudgeBpm(amount: number) {
  bpm.value = Math.min(240, Math.max(40, bpm.value + amount));
}

function applyPreset(nextBpm: number) {
  bpm.value = nextBpm;
}

function toggleSubdivisionMenu() {
  subdivisionMenuOpen.value = !subdivisionMenuOpen.value;
}

function closeSubdivisionMenu() {
  subdivisionMenuOpen.value = false;
}

function selectSubdivision(optionId: NoteSubdivisionId) {
  selectedSubdivisionId.value = optionId;
  subdivisionMenuOpen.value = false;

  if (!isPlaying.value) {
    syncSubdivisionNow();
  }
}

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
});
</script>

<template>
  <main class="page-shell">
    <Transition name="screen-fade" mode="out-in">
      <SplashIntro v-if="showSplash" />

      <section v-else class="meter-stage">
        <div class="meter-display">
          <div class="display-top">
            <span class="tag tag-strong">{{ timeSignature }}</span>
            <span class="tag app-note-tag">
              <NotationGlyph
                class="app-note-glyph app-note-glyph-compact"
                :variant="selectedSubdivision.id"
                :width="56"
                :height="32"
              />
              <span>{{ selectedSubdivision.shortLabel }}</span>
            </span>
          </div>

          <div class="bpm-block">
            <button class="stepper" type="button" @click="nudgeBpm(-1)">
              -
            </button>
            <div
              :class="[
                'meter-focus-frame',
                {
                  'is-active': isPlaying,
                  'is-pulsing': glowPulseActive,
                },
              ]"
              :style="stageGlowStyle"
            >
              <div class="bpm-value">
                <span class="bpm-number">{{ bpm }}</span>
                <span class="bpm-unit">BPM</span>
              </div>

              <div class="beat-row">
                <span
                  v-for="beat in beatDots"
                  :key="beat.id"
                  :class="['beat-dot', { active: beat.active }]"
                ></span>
              </div>
            </div>
            <button class="stepper" type="button" @click="nudgeBpm(1)">
              +
            </button>
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
              <div class="setting-card setting-card-highlight">
                <span class="setting-label">拍号</span>
                <strong class="setting-value setting-value-emphasis">{{
                  timeSignature
                }}</strong>
              </div>
              <div class="setting-card note-setting-card">
                <span class="setting-label">音符</span>
                <button
                  class="note-select-trigger"
                  type="button"
                  @click="toggleSubdivisionMenu"
                >
                  <strong class="app-note-trigger-content">
                    <NotationGlyph
                      class="app-note-glyph"
                      :variant="selectedSubdivision.id"
                      :width="132"
                      :height="72"
                    />
                    <span>{{ subdivisionDisplay }}</span>
                  </strong>
                  <span class="note-select-caret">{{
                    subdivisionMenuOpen ? "▲" : "▼"
                  }}</span>
                </button>
              </div>
              <div class="setting-card setting-card-highlight">
                <span class="setting-label">音色</span>
                <strong class="setting-value">{{ soundPack }}</strong>
              </div>
              <div class="setting-card setting-card-highlight">
                <span class="setting-label">重音</span>
                <strong class="setting-value accent-pattern-value">{{
                  accentPattern
                }}</strong>
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

  <SubdivisionPickerSheet
    :open="subdivisionMenuOpen"
    :current-subdivision-id="selectedSubdivision.id"
    :current-subdivision-label="subdivisionDisplay"
    :options="subdivisionOptions"
    @close="closeSubdivisionMenu"
    @select="selectSubdivision"
  />
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
  align-items: flex-start;
  gap: 6px;
}

.tag {
  --top-tag-height: 38px;
  display: inline-flex;
  height: var(--top-tag-height);
  align-items: center;
  justify-content: center;
  min-height: var(--top-tag-height);
  padding: 0 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  color: rgba(246, 237, 216, 0.84);
  font-size: 0.84rem;
  line-height: 1;
  box-sizing: border-box;
}

.tag-strong {
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.app-note-tag {
  display: inline-flex;
  align-items: center;
  height: var(--top-tag-height);
  gap: 6px;
  color: #fff7ea;
  padding-right: 12px;
}

.app-note-tag span:last-child {
  font-weight: 600;
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

.meter-focus-frame {
  position: relative;
  display: grid;
  width: min(320px, 100%);
  aspect-ratio: 1 / 1;
  justify-self: center;
  justify-items: center;
  align-content: center;
  gap: 18px;
  padding: 18px 24px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.04);
  background: rgba(14, 11, 9, 0.12);
  isolation: isolate;
  overflow: visible;
  transition:
    transform 140ms ease,
    box-shadow 140ms ease,
    filter 140ms ease,
    border-color 140ms ease,
    background-color 140ms ease;
}

.meter-focus-frame > * {
  position: relative;
  z-index: 1;
}

.meter-focus-frame::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1.5px;
  background: conic-gradient(
    from 180deg,
    color-mix(in srgb, var(--glow-primary) 70%, white 10%),
    color-mix(in srgb, var(--glow-secondary) 66%, white 12%),
    color-mix(in srgb, var(--glow-accent) 62%, white 14%),
    color-mix(in srgb, var(--glow-primary) 70%, white 10%)
  );
  -webkit-mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
  mask-composite: exclude;
  opacity: 0;
  z-index: 0;
  transition:
    opacity 140ms ease,
    filter 140ms ease,
    transform 140ms ease;
}

.meter-focus-frame::after {
  content: "";
  position: absolute;
  inset: -6px;
  border-radius: inherit;
  background: radial-gradient(
    circle at center,
    color-mix(in srgb, var(--glow-secondary) 16%, transparent) 0%,
    color-mix(in srgb, var(--glow-primary) 12%, transparent) 48%,
    transparent 76%
  );
  opacity: 0;
  filter: blur(14px) saturate(110%);
  z-index: 0;
  transition:
    opacity 140ms ease,
    filter 140ms ease,
    transform 140ms ease;
}

.meter-focus-frame.is-active {
  border-color: color-mix(in srgb, var(--glow-primary) 18%, rgba(255, 255, 255, 0.1));
  background: rgba(14, 11, 9, 0.18);
  box-shadow: 0 0 18px color-mix(in srgb, var(--glow-shadow) 34%, transparent);
}

.meter-focus-frame.is-active::before {
  opacity: 0.72;
}

.meter-focus-frame.is-active::after {
  opacity: 0.42;
  filter: blur(16px) saturate(118%);
}

.meter-focus-frame.is-pulsing {
  transform: scale(1.004);
  filter: saturate(108%);
  box-shadow:
    0 0 20px color-mix(in srgb, var(--glow-shadow) 42%, transparent),
    0 0 32px color-mix(in srgb, var(--glow-primary) 14%, transparent);
}

.meter-focus-frame.is-pulsing::before {
  opacity: 0.86;
  filter: saturate(122%) brightness(1.02);
  transform: scale(1.004);
}

.meter-focus-frame.is-pulsing::after {
  opacity: 0.56;
  filter: blur(18px) saturate(124%);
  transform: scale(1.018);
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
  width: 100%;
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
  width: 168px;
  height: 48px;
  min-width: 0;
  padding: 0 20px;
  border-radius: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #dfac53, #be7d2e);
  color: #1c140d;
  font-weight: 700;
  font-size: 0.96rem;
  line-height: 1;
  box-shadow:
    inset 0 1px 0 rgba(255, 248, 229, 0.32),
    0 10px 24px rgba(190, 125, 46, 0.22);
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
  gap: 8px;
  min-height: 96px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  transition:
    border-color 180ms ease,
    background-color 180ms ease,
    transform 180ms ease,
    box-shadow 180ms ease;
}

.setting-card:hover {
  border-color: rgba(223, 172, 83, 0.24);
  background: rgba(255, 255, 255, 0.06);
  transform: translateY(-1px);
}

.setting-card-highlight {
  background:
    linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.07),
      rgba(255, 255, 255, 0.03)
    ),
    radial-gradient(
      circle at top right,
      rgba(223, 172, 83, 0.16),
      transparent 48%
    );
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.note-setting-card {
  position: relative;
  background:
    linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.055),
      rgba(255, 255, 255, 0.028)
    ),
    radial-gradient(
      circle at top right,
      rgba(94, 129, 115, 0.18),
      transparent 52%
    );
}

.setting-label {
  color: rgba(246, 237, 216, 0.56);
  font-size: 0.8rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.setting-value {
  display: block;
  color: #fff7e7;
  font-size: 1.04rem;
  line-height: 1.45;
  word-break: break-word;
}

.setting-value-emphasis {
  font-size: clamp(1.5rem, 3vw, 2rem);
  line-height: 1;
  letter-spacing: 0.04em;
}

.accent-pattern-value {
  color: #f3c97a;
  letter-spacing: 0.08em;
}

.note-select-trigger {
  width: 100%;
  padding: 4px 0 0;
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

.app-note-trigger-content {
  display: grid;
  grid-template-columns: 1fr;
  justify-items: center;
  align-content: center;
  gap: 8px;
  min-height: 82px;
}

.app-note-trigger-content span {
  display: block;
  text-align: center;
  white-space: normal;
  color: #fff7e7;
}

.note-select-caret {
  color: rgba(246, 237, 216, 0.58);
  font-size: 0.76rem;
}

.app-note-glyph {
  flex: none;
  color: #fff8ee;
  width: 148px;
  height: 82px;
}

.app-note-glyph-compact {
  width: 60px;
  height: 34px;
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

  .meter-focus-frame {
    width: min(320px, 100%);
    gap: 14px;
    padding: 14px 16px;
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
