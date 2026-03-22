<script setup lang="ts">
import { computed, ref } from "vue";

const bpm = ref(96);
const isPlaying = ref(false);
const timeSignature = ref("4/4");
const subdivision = ref("16 分音符");
const soundPack = ref("Studio Click");
const accentPattern = ref("强-弱-弱-弱");

const beatDots = computed(() =>
  Array.from({ length: 4 }, (_, index) => ({
    id: index,
    active: index === 0,
  })),
);

const quickPresets = [
  { label: "热身", bpm: 72, detail: "4/4 · 八分音符" },
  { label: "爬格子", bpm: 96, detail: "4/4 · 16 分音符" },
  { label: "切分", bpm: 112, detail: "4/4 · 重音训练" },
];

const controlChips = [
  { label: "Tap Tempo", value: "已规划" },
  { label: "鼓声音色", value: "基础包" },
  { label: "自动提速", value: "第二阶段" },
];

function togglePlayback() {
  isPlaying.value = !isPlaying.value;
}

function nudgeBpm(amount: number) {
  bpm.value = Math.min(240, Math.max(40, bpm.value + amount));
}
</script>

<template>
  <main class="page-shell">
    <section class="hero-panel">
      <div class="hero-copy">
        <p class="eyebrow">TempoGuitar</p>
        <h1>为练琴而生的桌面节拍器</h1>
        <p class="hero-text">
          先把最重要的体验做扎实：稳定的节拍、清晰的节奏反馈、顺手的参数调整，以及适合长期打开使用的桌面界面。
        </p>
      </div>

      <div class="hero-meta">
        <span class="meta-label">当前目标</span>
        <strong>节拍器首页原型</strong>
        <span class="meta-note">下一步接入真实 BPM 调度与声音播放</span>
      </div>
    </section>

    <section class="meter-stage">
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
            <span class="section-badge">MVP</span>
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
            <span class="section-badge muted">草案</span>
          </div>

          <div class="preset-list">
            <button
              v-for="preset in quickPresets"
              :key="preset.label"
              class="preset-card"
              type="button"
            >
              <strong>{{ preset.label }}</strong>
              <span>{{ preset.bpm }} BPM</span>
              <small>{{ preset.detail }}</small>
            </button>
          </div>
        </div>
      </aside>
    </section>

    <section class="bottom-strip">
      <article class="bottom-card" v-for="chip in controlChips" :key="chip.label">
        <span>{{ chip.label }}</span>
        <strong>{{ chip.value }}</strong>
      </article>
    </section>
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

:global(body) {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
}

:global(button),
:global(input) {
  font: inherit;
}

:global(#app) {
  min-height: 100vh;
}

.page-shell {
  min-height: 100vh;
  padding: 24px;
  display: grid;
  gap: 20px;
  box-sizing: border-box;
}

.hero-panel,
.meter-stage,
.bottom-strip {
  width: min(1180px, 100%);
  margin: 0 auto;
}

.hero-panel {
  padding: 28px 32px;
  display: flex;
  justify-content: space-between;
  gap: 20px;
  border-radius: 28px;
  background: linear-gradient(135deg, rgba(37, 31, 26, 0.92), rgba(21, 19, 16, 0.82));
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.32);
}

.hero-copy {
  max-width: 700px;
}

.eyebrow {
  margin: 0 0 14px;
  color: #dfac53;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  font-size: 0.78rem;
}

h1 {
  margin: 0;
  font-size: clamp(2.3rem, 5vw, 4.8rem);
  line-height: 1.02;
}

.hero-text {
  margin: 18px 0 0;
  color: rgba(246, 237, 216, 0.78);
  line-height: 1.75;
  max-width: 620px;
}

.hero-meta {
  min-width: 220px;
  align-self: flex-start;
  padding: 18px 20px;
  display: grid;
  gap: 6px;
  border-radius: 20px;
  background: rgba(223, 172, 83, 0.12);
}

.meta-label,
.section-badge,
.section-badge.muted {
  font-size: 0.78rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.meta-label,
.section-badge {
  color: #dfac53;
}

.meta-note,
.section-header p {
  color: rgba(246, 237, 216, 0.68);
}

.meter-stage {
  display: grid;
  gap: 20px;
  grid-template-columns: minmax(0, 1.25fr) minmax(320px, 0.75fr);
}

.meter-display,
.control-panel,
.bottom-card {
  border-radius: 28px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(24, 21, 18, 0.88);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.26);
}

.meter-display {
  padding: 28px;
  display: grid;
  gap: 24px;
}

.display-top {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.tag {
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  color: rgba(246, 237, 216, 0.84);
}

.bpm-block {
  display: grid;
  grid-template-columns: 68px 1fr 68px;
  align-items: center;
  gap: 16px;
}

.stepper,
.transport,
.preset-card {
  border: 0;
  cursor: pointer;
}

.stepper {
  height: 68px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.06);
  color: #f6edd8;
  font-size: 1.5rem;
}

.bpm-value {
  display: grid;
  justify-items: center;
}

.bpm-number {
  font-size: clamp(5rem, 16vw, 9rem);
  line-height: 0.95;
  font-weight: 700;
}

.bpm-unit {
  margin-top: 10px;
  color: rgba(246, 237, 216, 0.65);
  letter-spacing: 0.28em;
  text-transform: uppercase;
}

.beat-row {
  display: flex;
  justify-content: center;
  gap: 14px;
}

.beat-dot {
  width: 18px;
  height: 18px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.14);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08);
}

.beat-dot.active {
  background: #dfac53;
  box-shadow: 0 0 24px rgba(223, 172, 83, 0.7);
}

.transport {
  justify-self: center;
  min-width: 220px;
  padding: 16px 28px;
  border-radius: 999px;
  background: linear-gradient(135deg, #dfac53, #be7d2e);
  color: #1c140d;
  font-weight: 700;
  font-size: 1.08rem;
}

.control-panel {
  padding: 24px;
  display: grid;
  gap: 24px;
}

.panel-section {
  display: grid;
  gap: 16px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.section-header h2 {
  margin: 0;
  font-size: 1.18rem;
}

.section-badge.muted {
  color: rgba(246, 237, 216, 0.46);
}

.setting-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.setting-card,
.preset-card,
.bottom-card {
  padding: 16px;
  background: rgba(255, 255, 255, 0.04);
}

.setting-card {
  border-radius: 18px;
  display: grid;
  gap: 6px;
}

.setting-label {
  color: rgba(246, 237, 216, 0.56);
  font-size: 0.84rem;
}

.preset-list {
  display: grid;
  gap: 12px;
}

.preset-card {
  border-radius: 18px;
  color: #f6edd8;
  display: grid;
  gap: 4px;
  text-align: left;
}

.preset-card small {
  color: rgba(246, 237, 216, 0.56);
}

.bottom-strip {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.bottom-card {
  border-radius: 22px;
  display: grid;
  gap: 8px;
}

.bottom-card span {
  color: rgba(246, 237, 216, 0.6);
}

@media (max-width: 980px) {
  .hero-panel,
  .meter-stage,
  .bottom-strip {
    width: min(100%, 860px);
  }

  .hero-panel,
  .meter-stage {
    grid-template-columns: 1fr;
  }

  .hero-panel {
    flex-direction: column;
  }

  .hero-meta {
    min-width: 0;
  }

  .bottom-strip {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .page-shell {
    padding: 14px;
  }

  .hero-panel,
  .meter-display,
  .control-panel {
    padding: 20px 18px;
    border-radius: 22px;
  }

  .bpm-block {
    grid-template-columns: 56px 1fr 56px;
    gap: 10px;
  }

  .stepper {
    height: 56px;
    border-radius: 18px;
  }

  .setting-grid {
    grid-template-columns: 1fr;
  }
}
</style>
