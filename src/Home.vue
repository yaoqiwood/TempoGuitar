<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import NotationGlyph from "./components/NotationGlyph.vue";
import SoundPickerSheet from "./components/SoundPickerSheet.vue";
import SplashIntro from "./components/SplashIntro.vue";
import SubdivisionPickerSheet from "./components/SubdivisionPickerSheet.vue";
import TimeSignaturePickerSheet from "./components/TimeSignaturePickerSheet.vue";
import { useMetronomeEngine } from "./composables/useMetronomeEngine";
import { soundPackOptions, type SoundPackId } from "./types/sound-pack";
import {
  timeSignatureOptions,
  type TimeSignatureId,
} from "./types/time-signature";
import {
  subdivisionOptions,
  type NoteSubdivisionId,
} from "./types/subdivision";

const DEFAULT_BPM = 96;
const DEFAULT_TIME_SIGNATURE_ID: TimeSignatureId = "4/4";
const DEFAULT_SUBDIVISION_ID: NoteSubdivisionId = subdivisionOptions[0].id;
const DEFAULT_SOUND_PACK_ID: SoundPackId = soundPackOptions[0].id;
const DEFAULT_METRONOME_VOLUME_PERCENT = 70;
const MAX_METRONOME_VOLUME_PERCENT = 100;
const METRONOME_VOLUME_OUTPUT_MULTIPLIER = 2;

const bpm = ref(DEFAULT_BPM);
const timeSignatureMenuOpen = ref(false);
const soundMenuOpen = ref(false);
const settingsMenuOpen = ref(false);
const resetConfirmOpen = ref(false);
const authorModalOpen = ref(false);
const authorWechatQrImageAvailable = ref(true);
const donationWechatPayImageAvailable = ref(true);
const selectedSoundPackId = ref<SoundPackId>(DEFAULT_SOUND_PACK_ID);
const selectedTimeSignatureId = ref<TimeSignatureId>(DEFAULT_TIME_SIGNATURE_ID);
const subdivisionMenuOpen = ref(false);
const selectedSubdivisionId = ref<NoteSubdivisionId>(DEFAULT_SUBDIVISION_ID);
const metronomeVolumePercent = ref(DEFAULT_METRONOME_VOLUME_PERCENT);
const metronomeVolume = computed(
  () => (metronomeVolumePercent.value / 100) * METRONOME_VOLUME_OUTPUT_MULTIPLIER,
);
const showSplash = ref(true);
const saveCurrentStateStatus = ref<"idle" | "saved" | "error">("idle");
const authorWechatQrImageUrl = "/author-wechat-qr.jpg";
const donationWechatPayImageUrl = "/donation-wechat-pay.jpg";

const SAVED_METRONOME_SETTINGS_KEY =
  "tempoguitar:saved-metronome-settings:v1";
const timeSignatureIdSet = new Set(timeSignatureOptions.map((option) => option.id));
const subdivisionIdSet = new Set(subdivisionOptions.map((option) => option.id));
const soundPackIdSet = new Set(soundPackOptions.map((option) => option.id));

type SavedMetronomeSettings = {
  bpm: number;
  timeSignatureId: TimeSignatureId;
  subdivisionId: NoteSubdivisionId;
  soundPackId: SoundPackId;
  metronomeVolumePercent: number;
  savedAtIso: string;
};
const selectedTimeSignature = computed(
  () =>
    timeSignatureOptions.find(
      (option) => option.id === selectedTimeSignatureId.value,
    ) ?? timeSignatureOptions[0],
);
const beatsPerMeasure = computed(() => selectedTimeSignature.value.numerator);
const beatUnitDenominator = computed(
  () => selectedTimeSignature.value.denominator,
);

const {
  currentBeat,
  glowPulseActive,
  isPlaying,
  stopMetronome,
  syncSubdivisionNow,
  togglePlayback,
  warmupAudioContext,
} = useMetronomeEngine({
  bpm,
  selectedSubdivisionId,
  selectedSoundPackId,
  beatsPerMeasure,
  beatUnitDenominator,
  metronomeVolume,
});

const quickPresets = [
  { label: "热身", bpm: 72, detail: "舒展手指，慢速进入练习状态" },
  { label: "基础", bpm: 96, detail: "日常练习的稳定速度" },
  { label: "冲刺", bpm: 120, detail: "提升控制力与耐力" },
];

const beatDots = computed(() =>
  Array.from({ length: beatsPerMeasure.value }, (_, index) => ({
    id: index,
    active: index === currentBeat.value,
  })),
);
const isStrongBeatPulse = computed(
  () => isPlaying.value && glowPulseActive.value && currentBeat.value === 0,
);

const selectedSubdivision = computed(
  () =>
    subdivisionOptions.find(
      (option) => option.id === selectedSubdivisionId.value,
    ) ?? subdivisionOptions[0],
);
const selectedSoundPack = computed(
  () =>
    soundPackOptions.find(
      (option) => option.id === selectedSoundPackId.value,
    ) ?? soundPackOptions[0],
);

const accentPattern = computed(
  () => selectedSubdivision.value.accentDescription,
);
const subdivisionDisplay = computed(() => selectedSubdivision.value.label);
const soundPackDisplay = computed(() => selectedSoundPack.value.label);
const timeSignatureDisplay = computed(() => selectedTimeSignature.value.label);
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
    "--bpm-progress": `${(bpmProgress.value * 100).toFixed(3)}%`,
    "--drag-angle": `${bpmDialAngle.value.toFixed(3)}deg`,
  };
});

let splashHideTimer: ReturnType<typeof setTimeout> | undefined;
let saveCurrentStateStatusTimer: ReturnType<typeof setTimeout> | undefined;
const minBpm = 40;
const maxBpm = 240;
const bpmPerFullTurn = 80;
const isBpmDragging = ref(false);
const isBpmDragReady = ref(false);
const bpmProgress = computed(() => (bpm.value - minBpm) / (maxBpm - minBpm));
const bpmDialAngle = computed(() => -90 + bpmProgress.value * 360);
const saveCurrentStateLabel = computed(() => {
  if (saveCurrentStateStatus.value === "saved") {
    return "已保存";
  }

  if (saveCurrentStateStatus.value === "error") {
    return "保存失败";
  }

  return "保存当前";
});

let dragPointerId: number | null = null;
let dragLastAngle = 0;
let dragBpmAccumulator = 0;

function clampBpm(value: number) {
  return Math.min(maxBpm, Math.max(minBpm, value));
}

function clampVolumePercent(value: number) {
  return Math.min(MAX_METRONOME_VOLUME_PERCENT, Math.max(0, value));
}

function isTimeSignatureId(value: unknown): value is TimeSignatureId {
  return typeof value === "string" && timeSignatureIdSet.has(value as TimeSignatureId);
}

function isSubdivisionId(value: unknown): value is NoteSubdivisionId {
  return typeof value === "string" && subdivisionIdSet.has(value as NoteSubdivisionId);
}

function isSoundPackId(value: unknown): value is SoundPackId {
  return typeof value === "string" && soundPackIdSet.has(value as SoundPackId);
}

function setSaveCurrentStateStatus(nextStatus: "idle" | "saved" | "error") {
  saveCurrentStateStatus.value = nextStatus;

  if (saveCurrentStateStatusTimer) {
    clearTimeout(saveCurrentStateStatusTimer);
    saveCurrentStateStatusTimer = undefined;
  }

  if (nextStatus === "idle") {
    return;
  }

  saveCurrentStateStatusTimer = window.setTimeout(() => {
    saveCurrentStateStatus.value = "idle";
    saveCurrentStateStatusTimer = undefined;
  }, 1800);
}

function saveCurrentMetronomeSettings() {
  try {
    const payload: SavedMetronomeSettings = {
      bpm: bpm.value,
      timeSignatureId: selectedTimeSignatureId.value,
      subdivisionId: selectedSubdivisionId.value,
      soundPackId: selectedSoundPackId.value,
      metronomeVolumePercent: metronomeVolumePercent.value,
      savedAtIso: new Date().toISOString(),
    };

    window.localStorage.setItem(
      SAVED_METRONOME_SETTINGS_KEY,
      JSON.stringify(payload),
    );
    setSaveCurrentStateStatus("saved");
  } catch {
    setSaveCurrentStateStatus("error");
  }
}

function applyFactoryDefaults() {
  bpm.value = DEFAULT_BPM;
  selectedTimeSignatureId.value = DEFAULT_TIME_SIGNATURE_ID;
  selectedSubdivisionId.value = DEFAULT_SUBDIVISION_ID;
  selectedSoundPackId.value = DEFAULT_SOUND_PACK_ID;
  metronomeVolumePercent.value = DEFAULT_METRONOME_VOLUME_PERCENT;
}

function resetMetronomeSettings() {
  applyFactoryDefaults();
  setSaveCurrentStateStatus("idle");

  try {
    window.localStorage.removeItem(SAVED_METRONOME_SETTINGS_KEY);
  } catch {
    // Ignore storage cleanup errors and still restore in-memory defaults.
  }

  if (!isPlaying.value) {
    syncSubdivisionNow();
  }
}

function restoreSavedMetronomeSettings() {
  const savedRaw = window.localStorage.getItem(SAVED_METRONOME_SETTINGS_KEY);

  if (!savedRaw) {
    return;
  }

  try {
    const parsed: Partial<SavedMetronomeSettings> = JSON.parse(savedRaw);

    if (typeof parsed.bpm === "number" && Number.isFinite(parsed.bpm)) {
      bpm.value = clampBpm(Math.round(parsed.bpm));
    }

    if (isTimeSignatureId(parsed.timeSignatureId)) {
      selectedTimeSignatureId.value = parsed.timeSignatureId;
    }

    if (isSubdivisionId(parsed.subdivisionId)) {
      selectedSubdivisionId.value = parsed.subdivisionId;
    }

    if (isSoundPackId(parsed.soundPackId)) {
      selectedSoundPackId.value = parsed.soundPackId;
    }

    if (
      typeof parsed.metronomeVolumePercent === "number" &&
      Number.isFinite(parsed.metronomeVolumePercent)
    ) {
      metronomeVolumePercent.value = clampVolumePercent(
        Math.round(parsed.metronomeVolumePercent),
      );
    }
  } catch {
    window.localStorage.removeItem(SAVED_METRONOME_SETTINGS_KEY);
  }
}

function getPointerAngle(event: PointerEvent, element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  return (
    (Math.atan2(event.clientY - centerY, event.clientX - centerX) * 180) /
    Math.PI
  );
}

function normalizeAngleDelta(delta: number) {
  if (delta > 180) {
    return delta - 360;
  }

  if (delta < -180) {
    return delta + 360;
  }

  return delta;
}

function applyDragAngleDelta(deltaAngle: number) {
  dragBpmAccumulator += (deltaAngle / 360) * bpmPerFullTurn;
  const wholeStep =
    dragBpmAccumulator > 0
      ? Math.floor(dragBpmAccumulator)
      : Math.ceil(dragBpmAccumulator);

  if (wholeStep === 0) {
    return;
  }

  bpm.value = clampBpm(bpm.value + wholeStep);
  dragBpmAccumulator -= wholeStep;
}

function onMeterFramePointerDown(event: PointerEvent) {
  const element = event.currentTarget as HTMLElement | null;

  if (!element) {
    return;
  }

  if (isPlaying.value) {
    stopMetronome();
  }

  dragPointerId = event.pointerId;
  dragLastAngle = getPointerAngle(event, element);
  dragBpmAccumulator = 0;
  isBpmDragging.value = true;
  isBpmDragReady.value = true;

  element.setPointerCapture?.(event.pointerId);
  event.preventDefault();
}

function onMeterFramePointerEnter() {
  isBpmDragReady.value = true;
}

function onMeterFramePointerLeave() {
  if (isBpmDragging.value) {
    return;
  }

  isBpmDragReady.value = false;
}

function onMeterFramePointerMove(event: PointerEvent) {
  const element = event.currentTarget as HTMLElement | null;

  if (!element || !isBpmDragging.value || event.pointerId !== dragPointerId) {
    return;
  }

  const angle = getPointerAngle(event, element);
  const deltaAngle = normalizeAngleDelta(angle - dragLastAngle);
  dragLastAngle = angle;
  applyDragAngleDelta(deltaAngle);
}

function endMeterFrameDrag(event: PointerEvent) {
  const element = event.currentTarget as HTMLElement | null;

  if (!isBpmDragging.value || event.pointerId !== dragPointerId) {
    return;
  }

  element?.releasePointerCapture?.(event.pointerId);
  isBpmDragging.value = false;
  isBpmDragReady.value = !!element?.matches(":hover");
  dragPointerId = null;
  dragBpmAccumulator = 0;
}

function applyPreset(nextBpm: number) {
  bpm.value = nextBpm;
}

function toggleTimeSignatureMenu() {
  timeSignatureMenuOpen.value = !timeSignatureMenuOpen.value;
}

function closeTimeSignatureMenu() {
  timeSignatureMenuOpen.value = false;
}

function selectTimeSignature(optionId: TimeSignatureId) {
  selectedTimeSignatureId.value = optionId;
  timeSignatureMenuOpen.value = false;
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

function toggleSoundMenu() {
  soundMenuOpen.value = !soundMenuOpen.value;
}

function closeSoundMenu() {
  soundMenuOpen.value = false;
}

function selectSoundPack(optionId: SoundPackId) {
  selectedSoundPackId.value = optionId;
  soundMenuOpen.value = false;
}

function toggleSettingsMenu() {
  settingsMenuOpen.value = !settingsMenuOpen.value;

  if (!settingsMenuOpen.value) {
    resetConfirmOpen.value = false;
    authorModalOpen.value = false;
  }
}

function closeSettingsMenu() {
  settingsMenuOpen.value = false;
  resetConfirmOpen.value = false;
  authorModalOpen.value = false;
}

function openResetConfirm() {
  resetConfirmOpen.value = true;
}

function closeResetConfirm() {
  resetConfirmOpen.value = false;
}

function confirmResetMetronomeSettings() {
  resetMetronomeSettings();
  resetConfirmOpen.value = false;
}

function openAuthorModal() {
  authorModalOpen.value = true;
  resetConfirmOpen.value = false;
}

function closeAuthorModal() {
  authorModalOpen.value = false;
}

function handleAuthorWechatQrImageError() {
  authorWechatQrImageAvailable.value = false;
}

function handleDonationWechatPayImageError() {
  donationWechatPayImageAvailable.value = false;
}

onMounted(() => {
  restoreSavedMetronomeSettings();

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

  if (saveCurrentStateStatusTimer) {
    clearTimeout(saveCurrentStateStatusTimer);
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
            <span class="tag tag-strong">{{ timeSignatureDisplay }}</span>
            <span class="tag app-note-tag">
              <NotationGlyph
                class="app-note-glyph app-note-glyph-compact"
                :variant="selectedSubdivision.id"
                :width="56"
                :height="32"
              />
              <span>{{ selectedSubdivision.shortLabel }}</span>
            </span>
            <div class="top-action-group">
              <button
                :class="[
                  'quick-save-button',
                  {
                    'is-saved': saveCurrentStateStatus === 'saved',
                    'is-error': saveCurrentStateStatus === 'error',
                  },
                ]"
                type="button"
                aria-label="保存当前节拍器参数"
                @click="saveCurrentMetronomeSettings"
              >
                {{ saveCurrentStateLabel }}
              </button>
              <button
                class="settings-gear"
                type="button"
                aria-label="节拍器设置"
                @click="toggleSettingsMenu"
              >
                ⚙
              </button>
            </div>
          </div>

          <div class="bpm-block">
            <div
              :class="[
                'meter-focus-frame',
                {
                  'is-active': isPlaying,
                  'is-pulsing': glowPulseActive,
                  'is-strong-pulse': isStrongBeatPulse,
                  'is-drag-ready': isBpmDragReady,
                  'is-dragging': isBpmDragging,
                },
              ]"
              :style="stageGlowStyle"
              @pointerenter="onMeterFramePointerEnter"
              @pointerleave="onMeterFramePointerLeave"
              @pointerdown="onMeterFramePointerDown"
              @pointermove="onMeterFramePointerMove"
              @pointerup="endMeterFrameDrag"
              @pointercancel="endMeterFrameDrag"
            >
              <div class="drag-orbit" aria-hidden="true">
                <span class="drag-handle-track">
                  <span class="drag-handle"></span>
                </span>
              </div>
              <span class="drag-hint" aria-hidden="true">
                {{
                  isBpmDragging
                    ? "正在调整速度"
                    : "拖动圆环调整速度"
                }}
              </span>
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
                <button
                  class="note-select-trigger"
                  type="button"
                  @click="toggleTimeSignatureMenu"
                >
                  <strong class="signature-trigger-content">
                    <span class="signature-trigger-title">{{
                      timeSignatureDisplay
                    }}</span>
                  </strong>
                  <span class="note-select-caret">{{
                    timeSignatureMenuOpen ? "^" : "v"
                  }}</span>
                </button>
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
                    subdivisionMenuOpen ? "^" : "v"
                  }}</span>
                </button>
              </div>
              <div class="setting-card setting-card-highlight">
                <span class="setting-label">音色</span>
                <button
                  class="note-select-trigger"
                  type="button"
                  @click="toggleSoundMenu"
                >
                  <strong class="sound-trigger-content">
                    <span class="sound-trigger-title">{{
                      soundPackDisplay
                    }}</span>
                    <span class="sound-trigger-preview">{{
                      selectedSoundPack.previewLine
                    }}</span>
                  </strong>
                  <span class="note-select-caret">{{
                    soundMenuOpen ? "^" : "v"
                  }}</span>
                </button>
              </div>
              <div class="setting-card setting-card-highlight">
                <span class="setting-label">说明</span> 
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

  <Transition name="sheet-fade">
    <div
      v-if="settingsMenuOpen"
      class="settings-overlay"
      @click.self="closeSettingsMenu"
    >
      <section class="settings-panel">
        <div class="settings-header">
          <h3>节拍器设置</h3>
          <button type="button" class="settings-close" @click="closeSettingsMenu">
            关闭
          </button>
        </div>

        <div class="settings-row">
          <div class="settings-row-main">
            <span class="settings-label">节拍器音量</span>
            <strong class="settings-value">{{ metronomeVolumePercent }}%</strong>
          </div>
          <input
            v-model.number="metronomeVolumePercent"
            class="settings-slider"
            type="range"
            min="0"
            :max="MAX_METRONOME_VOLUME_PERCENT"
            step="1"
          />
        </div>

        <div class="settings-actions">
          <p class="settings-reset-hint">
            恢复默认 BPM、拍号、音符、音色和音量，并清除已保存参数。
          </p>
          <button
            type="button"
            class="settings-reset-button"
            @click="openResetConfirm"
          >
            恢复出厂设置
          </button>
          <button
            type="button"
            class="settings-about-button"
            @click="openAuthorModal"
          >
            关于作者
          </button>
        </div>

        <Transition name="sheet-fade">
          <div
            v-if="resetConfirmOpen"
            class="confirm-modal-overlay"
            @click.self="closeResetConfirm"
          >
            <section
              class="confirm-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="reset-confirm-title"
            >
              <h4 id="reset-confirm-title" class="confirm-modal-title">
                确认恢复出厂设置？
              </h4>
              <p class="confirm-modal-copy">
                这会恢复默认 BPM、拍号、音符、音色和音量，并清除已保存参数。
              </p>
              <div class="confirm-modal-actions">
                <button
                  type="button"
                  class="confirm-modal-button confirm-modal-button-secondary"
                  @click="closeResetConfirm"
                >
                  取消
                </button>
                <button
                  type="button"
                  class="confirm-modal-button confirm-modal-button-danger"
                  @click="confirmResetMetronomeSettings"
                >
                  确认恢复
                </button>
              </div>
            </section>
          </div>
        </Transition>

        <Transition name="sheet-fade">
          <div
            v-if="authorModalOpen"
            class="confirm-modal-overlay"
            @click.self="closeAuthorModal"
          >
            <section
              class="confirm-modal about-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="about-author-title"
            >
              <div class="about-modal-header">
                <div>
                  <h4 id="about-author-title" class="confirm-modal-title">
                    关于作者
                  </h4>
                  <p class="about-modal-version">版本：V1.0</p>
                </div>
                <button
                  type="button"
                  class="about-modal-close"
                  @click="closeAuthorModal"
                >
                  关闭
                </button>
              </div>

              <div class="about-modal-body">
                <section class="about-modal-section">
                  <span class="about-modal-label">捐赠项目：</span>
                  <img
                    v-if="donationWechatPayImageAvailable"
                    class="about-modal-image"
                    :src="donationWechatPayImageUrl"
                    alt="微信支付捐赠二维码"
                    @error="handleDonationWechatPayImageError"
                  />
                  <div v-else class="about-modal-fallback">Mikko柴柴</div>
                </section>

                <section class="about-modal-section">
                  <span class="about-modal-label">了解作者：</span>
                  <img
                    v-if="authorWechatQrImageAvailable"
                    class="about-modal-image"
                    :src="authorWechatQrImageUrl"
                    alt="作者微信二维码"
                    @error="handleAuthorWechatQrImageError"
                  />
                  <div v-else class="about-modal-fallback">Mikko柴柴</div>
                </section>
              </div>
            </section>
          </div>
        </Transition>
      </section>
    </div>
  </Transition>

  <TimeSignaturePickerSheet
    :open="timeSignatureMenuOpen"
    :current-time-signature-id="selectedTimeSignature.id"
    :current-time-signature-label="timeSignatureDisplay"
    :options="timeSignatureOptions"
    @close="closeTimeSignatureMenu"
    @select="selectTimeSignature"
  />

  <SubdivisionPickerSheet
    :open="subdivisionMenuOpen"
    :current-subdivision-id="selectedSubdivision.id"
    :current-subdivision-label="subdivisionDisplay"
    :options="subdivisionOptions"
    @close="closeSubdivisionMenu"
    @select="selectSubdivision"
  />

  <SoundPickerSheet
    :open="soundMenuOpen"
    :current-sound-pack-id="selectedSoundPack.id"
    :current-sound-pack-label="soundPackDisplay"
    :options="soundPackOptions"
    @close="closeSoundMenu"
    @select="selectSoundPack"
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
  overflow-x: hidden;
  overflow-y: auto;
}

.meter-stage {
  width: min(1120px, 100%);
  min-height: 100%;
  margin: 0 auto;
  padding-top: 2px;
  padding-bottom: 6px;
  box-sizing: border-box;
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

.top-action-group {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.quick-save-button {
  height: 38px;
  border: 0;
  border-radius: 999px;
  padding: 0 14px;
  background: rgba(255, 255, 255, 0.08);
  color: rgba(246, 237, 216, 0.92);
  font-size: 0.8rem;
  letter-spacing: 0.04em;
  white-space: nowrap;
  transition:
    background-color 140ms ease,
    color 140ms ease,
    transform 140ms ease;
}

.quick-save-button:hover {
  background: rgba(223, 172, 83, 0.2);
  transform: translateY(-1px);
}

.quick-save-button.is-saved {
  background: rgba(83, 197, 123, 0.22);
  color: #ccffd9;
}

.quick-save-button.is-error {
  background: rgba(226, 84, 84, 0.24);
  color: #ffd4d4;
}

.settings-gear {
  width: 38px;
  height: 38px;
  border: 0;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.08);
  color: rgba(246, 237, 216, 0.88);
  font-size: 1rem;
  line-height: 1;
  transition:
    transform 140ms ease,
    background-color 140ms ease;
}

.settings-gear:hover {
  background: rgba(223, 172, 83, 0.2);
  transform: rotate(18deg);
}

.settings-overlay {
  position: fixed;
  inset: 0;
  z-index: 96;
  background: rgba(7, 6, 5, 0.55);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: grid;
  place-items: center;
  padding: 16px;
  box-sizing: border-box;
}

.settings-panel {
  width: min(460px, 100%);
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: linear-gradient(
    180deg,
    rgba(31, 26, 20, 0.98),
    rgba(16, 13, 11, 0.99)
  );
  box-shadow: 0 20px 48px rgba(0, 0, 0, 0.36);
  padding: 16px;
  display: grid;
  gap: 14px;
}

.settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.settings-header h3 {
  margin: 0;
  font-size: 1.04rem;
}

.settings-close {
  border: 0;
  border-radius: 999px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.08);
  color: #f6edd8;
}

.settings-row {
  display: grid;
  gap: 12px;
}

.settings-row-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.settings-label {
  color: rgba(246, 237, 216, 0.72);
  font-size: 0.9rem;
}

.settings-value {
  color: #f6edd8;
  font-size: 1rem;
}

.settings-slider {
  width: 100%;
  accent-color: #dfac53;
}

.settings-actions {
  display: grid;
  gap: 10px;
  padding-top: 4px;
}

.settings-reset-hint {
  margin: 0;
  color: rgba(246, 237, 216, 0.56);
  font-size: 0.82rem;
  line-height: 1.45;
}

.settings-reset-button {
  border: 0;
  border-radius: 12px;
  min-height: 44px;
  padding: 0 14px;
  background: rgba(184, 72, 72, 0.2);
  color: #ffd9d9;
  font-weight: 600;
  transition:
    background-color 140ms ease,
    transform 140ms ease;
}

.settings-reset-button:hover {
  background: rgba(184, 72, 72, 0.3);
  transform: translateY(-1px);
}

.settings-about-button {
  border: 0;
  border-radius: 12px;
  min-height: 44px;
  padding: 0 14px;
  background: rgba(223, 172, 83, 0.18);
  color: #ffe9bf;
  font-weight: 600;
  transition:
    background-color 140ms ease,
    transform 140ms ease;
}

.settings-about-button:hover {
  background: rgba(223, 172, 83, 0.28);
  transform: translateY(-1px);
}

.confirm-modal-overlay {
  position: absolute;
  inset: 0;
  border-radius: 18px;
  background: rgba(8, 7, 6, 0.72);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  display: grid;
  place-items: center;
  padding: 16px;
  box-sizing: border-box;
}

.confirm-modal {
  width: min(320px, 100%);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: linear-gradient(
    180deg,
    rgba(40, 30, 26, 0.98),
    rgba(18, 14, 12, 0.99)
  );
  box-shadow: 0 18px 36px rgba(0, 0, 0, 0.34);
  padding: 18px;
  display: grid;
  gap: 14px;
}

.confirm-modal-title {
  margin: 0;
  font-size: 1rem;
  color: #fff3e2;
}

.confirm-modal-copy {
  margin: 0;
  color: rgba(246, 237, 216, 0.7);
  font-size: 0.88rem;
  line-height: 1.55;
}

.confirm-modal-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.confirm-modal-button {
  border: 0;
  border-radius: 12px;
  min-height: 42px;
  padding: 0 14px;
  font-weight: 600;
  transition:
    background-color 140ms ease,
    transform 140ms ease,
    color 140ms ease;
}

.confirm-modal-button:hover {
  transform: translateY(-1px);
}

.confirm-modal-button-secondary {
  background: rgba(255, 255, 255, 0.08);
  color: #f6edd8;
}

.confirm-modal-button-secondary:hover {
  background: rgba(255, 255, 255, 0.14);
}

.confirm-modal-button-danger {
  background: rgba(184, 72, 72, 0.22);
  color: #ffd9d9;
}

.confirm-modal-button-danger:hover {
  background: rgba(184, 72, 72, 0.32);
}

.about-modal {
  width: min(860px, 100%);
  max-height: min(760px, calc(100% - 12px));
  padding: 16px;
  gap: 16px;
}

.about-modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.about-modal-version {
  margin: 6px 0 0;
  color: rgba(246, 237, 216, 0.65);
  font-size: 0.82rem;
}

.about-modal-close {
  border: 0;
  border-radius: 999px;
  min-height: 34px;
  padding: 0 12px;
  background: rgba(255, 255, 255, 0.08);
  color: #f6edd8;
}

.about-modal-body {
  min-height: 0;
  overflow-y: auto;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: center;
  justify-items: center;
  gap: 20px;
  padding-right: 4px;
}

.about-modal-section {
  display: grid;
  align-content: center;
  justify-items: center;
  gap: 10px;
  width: 100%;
  text-align: center;
}

.about-modal-label {
  color: #fff3e2;
  font-size: 0.92rem;
  font-weight: 600;
}

.about-modal-image {
  display: block;
  width: min(100%, 320px);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.24);
}

.about-modal-fallback {
  width: min(100%, 320px);
  min-height: 320px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  padding: 24px;
  box-sizing: border-box;
  background:
    linear-gradient(135deg, rgba(223, 172, 83, 0.22), rgba(255, 255, 255, 0.08)),
    rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #fff3e2;
  font-size: 1.4rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-align: center;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

@media (max-width: 780px) {
  .about-modal {
    width: min(420px, 100%);
  }

  .about-modal-body {
    grid-template-columns: 1fr;
  }
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
  grid-template-columns: minmax(0, 1fr);
  justify-items: center;
}

.transport,
.preset-card {
  border: 0;
  cursor: pointer;
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
  touch-action: none;
  cursor: grab;
  transition:
    transform 160ms ease,
    box-shadow 160ms ease,
    filter 160ms ease,
    border-color 160ms ease,
    background-color 160ms ease;
}

.meter-focus-frame.is-dragging {
  cursor: grabbing;
}

.meter-focus-frame > * {
  position: relative;
  z-index: 1;
}

.drag-orbit {
  position: absolute;
  inset: 9px;
  border-radius: 50%;
  pointer-events: none;
  z-index: 0;
}

.drag-orbit::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: conic-gradient(
    from -90deg,
    color-mix(in srgb, var(--glow-secondary) 82%, white 8%) 0
      var(--bpm-progress),
    color-mix(in srgb, var(--glow-primary) 12%, transparent) var(--bpm-progress)
      100%
  );
  -webkit-mask: radial-gradient(
    farthest-side,
    transparent calc(100% - 10px),
    #000 calc(100% - 9px)
  );
  mask: radial-gradient(
    farthest-side,
    transparent calc(100% - 10px),
    #000 calc(100% - 9px)
  );
  opacity: 0.26;
  transition:
    opacity 160ms ease,
    filter 160ms ease;
}

.drag-handle-track {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  transform: rotate(var(--drag-angle));
  transition: transform 110ms linear;
}

.drag-handle {
  position: absolute;
  left: 50%;
  top: 1px;
  width: 13px;
  height: 13px;
  border-radius: 50%;
  transform: translateX(-50%);
  background: color-mix(in srgb, var(--glow-secondary) 72%, white 24%);
  box-shadow:
    0 0 0 2px rgba(16, 13, 10, 0.88),
    0 0 14px color-mix(in srgb, var(--glow-secondary) 42%, transparent);
  opacity: 0.88;
  transition:
    transform 160ms ease,
    box-shadow 160ms ease,
    opacity 160ms ease;
}

.drag-hint {
  position: absolute;
  top: 24px;
  left: 50%;
  transform: translate(-50%, -4px);
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.68rem;
  letter-spacing: 0.05em;
  color: rgba(246, 237, 216, 0.78);
  background: rgba(18, 15, 12, 0.52);
  border: 1px solid rgba(255, 255, 255, 0.08);
  white-space: nowrap;
  opacity: 0;
  transition:
    opacity 180ms ease,
    transform 180ms ease,
    color 180ms ease,
    border-color 180ms ease,
    background-color 180ms ease;
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
  border-color: color-mix(
    in srgb,
    var(--glow-primary) 18%,
    rgba(255, 255, 255, 0.1)
  );
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

.meter-focus-frame.is-drag-ready {
  border-color: color-mix(
    in srgb,
    var(--glow-secondary) 26%,
    rgba(255, 255, 255, 0.12)
  );
  background: rgba(14, 11, 9, 0.2);
  transform: scale(1.006);
}

.meter-focus-frame.is-drag-ready::before {
  opacity: 0.42;
}

.meter-focus-frame.is-drag-ready::after {
  opacity: 0.3;
  filter: blur(16px) saturate(116%);
}

.meter-focus-frame.is-drag-ready .drag-hint {
  opacity: 1;
  transform: translate(-50%, 0);
}

.meter-focus-frame.is-drag-ready .drag-orbit::before {
  opacity: 0.4;
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

.meter-focus-frame.is-strong-pulse {
  transform: scale(1.012);
  filter: saturate(116%) brightness(1.02);
  box-shadow:
    0 0 30px color-mix(in srgb, var(--glow-shadow) 56%, transparent),
    0 0 54px color-mix(in srgb, var(--glow-primary) 24%, transparent),
    0 0 88px color-mix(in srgb, var(--glow-accent) 14%, transparent);
}

.meter-focus-frame.is-strong-pulse::before {
  opacity: 0.98;
  filter: saturate(136%) brightness(1.08);
  transform: scale(1.024);
}

.meter-focus-frame.is-strong-pulse::after {
  inset: -18px;
  opacity: 0.82;
  filter: blur(28px) saturate(138%);
  transform: scale(1.08);
}

.meter-focus-frame.is-dragging {
  transform: scale(1.014);
  filter: saturate(122%);
  border-color: color-mix(
    in srgb,
    var(--glow-secondary) 34%,
    rgba(255, 255, 255, 0.14)
  );
  box-shadow:
    0 0 24px color-mix(in srgb, var(--glow-shadow) 48%, transparent),
    0 0 38px color-mix(in srgb, var(--glow-secondary) 24%, transparent);
}

.meter-focus-frame.is-dragging::before {
  opacity: 0.9;
  filter: saturate(128%) brightness(1.03);
}

.meter-focus-frame.is-dragging::after {
  opacity: 0.62;
  filter: blur(20px) saturate(130%);
}

.meter-focus-frame.is-dragging .drag-orbit::before {
  opacity: 0.72;
  filter: saturate(132%);
}

.meter-focus-frame.is-dragging .drag-handle {
  transform: translateX(-50%) scale(1.18);
  opacity: 1;
  box-shadow:
    0 0 0 2px rgba(16, 13, 10, 0.9),
    0 0 22px color-mix(in srgb, var(--glow-secondary) 62%, transparent);
}

.meter-focus-frame.is-dragging .drag-hint {
  opacity: 1;
  transform: translate(-50%, 0);
  color: #fff8ea;
  border-color: color-mix(
    in srgb,
    var(--glow-secondary) 34%,
    rgba(255, 255, 255, 0.12)
  );
  background: color-mix(
    in srgb,
    rgba(18, 15, 12, 0.84) 78%,
    var(--glow-primary) 22%
  );
}

.bpm-number {
  font-size: clamp(4.4rem, 12vw, 7rem);
  line-height: 0.92;
  font-weight: 700;
  transition:
    transform 120ms ease,
    text-shadow 120ms ease;
}

.meter-focus-frame.is-dragging .bpm-number {
  transform: scale(1.02);
  text-shadow: 0 0 24px
    color-mix(in srgb, var(--glow-secondary) 30%, transparent);
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

@media (hover: hover) and (pointer: fine) {
  .meter-focus-frame:hover:not(.is-dragging) {
    border-color: color-mix(
      in srgb,
      var(--glow-secondary) 22%,
      rgba(255, 255, 255, 0.12)
    );
    background: rgba(14, 11, 9, 0.19);
    transform: scale(1.005);
  }

  .meter-focus-frame:hover:not(.is-dragging) .drag-hint {
    opacity: 1;
    transform: translate(-50%, 0);
  }
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

.signature-trigger-content {
  display: grid;
  min-height: 62px;
  align-content: center;
}

.signature-trigger-title {
  color: #fff7e7;
  font-size: clamp(1.5rem, 3vw, 2rem);
  line-height: 1;
  letter-spacing: 0.04em;
}

.sound-trigger-content {
  display: grid;
  gap: 6px;
  min-height: 62px;
  align-content: center;
}

.sound-trigger-title {
  color: #fff7e7;
  font-size: 1rem;
}

.sound-trigger-preview {
  color: rgba(246, 237, 216, 0.72);
  font-size: 0.74rem;
  line-height: 1.4;
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
    grid-template-columns: minmax(0, 1fr);
  }

  .meter-focus-frame {
    width: min(320px, 100%);
    gap: 14px;
    padding: 14px 16px;
  }

  .setting-grid {
    grid-template-columns: 1fr;
  }
}
</style>
