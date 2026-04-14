<script setup lang="ts">
import type { SoundPackId, SoundPackOption } from "../types/sound-pack";

defineProps<{
  open: boolean;
  currentSoundPackId: SoundPackId;
  currentSoundPackLabel: string;
  options: SoundPackOption[];
}>();

const emit = defineEmits<{
  close: [];
  select: [id: SoundPackId];
}>();
</script>

<template>
  <Transition name="sheet-fade">
    <div v-if="open" class="sound-sheet-overlay" @click.self="emit('close')">
      <Transition name="sound-sheet">
        <section v-if="open" class="sound-sheet-panel">
          <div class="sound-sheet-header">
            <div>
              <span class="sound-sheet-eyebrow">音色面板</span>
              <h3>选择节拍器音色</h3>
            </div>
            <button
              class="sound-sheet-close"
              type="button"
              @click="emit('close')"
            >
              关闭
            </button>
          </div>

          <div class="sound-sheet-current">
            <span>当前：</span>
            <strong>{{ currentSoundPackLabel }}</strong>
          </div>

          <div class="sound-options-grid">
            <button
              v-for="option in options"
              :key="option.id"
              :class="[
                'sound-option',
                {
                  active: option.id === currentSoundPackId,
                },
              ]"
              type="button"
              @click="emit('select', option.id)"
            >
              <div class="sound-option-main">
                <strong class="sound-option-label">{{ option.label }}</strong>
                <span class="sound-option-subtitle">{{ option.subtitle }}</span>
              </div>
              <span class="sound-option-preview">{{ option.previewLine }}</span>
            </button>
          </div>
        </section>
      </Transition>
    </div>
  </Transition>
</template>

<style scoped>
.sound-sheet-overlay {
  position: fixed;
  inset: 0;
  background: rgba(7, 6, 5, 0.58);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 82;
}

.sound-sheet-panel {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: min(50vh, 500px);
  padding: 20px 20px 24px;
  border-radius: 28px 28px 0 0;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: linear-gradient(
    180deg,
    rgba(31, 26, 20, 0.98),
    rgba(16, 13, 11, 0.99)
  );
  box-shadow: 0 -18px 48px rgba(0, 0, 0, 0.32);
  display: grid;
  grid-template-rows: auto auto 1fr;
  gap: 14px;
}

.sound-sheet-header {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 12px;
}

.sound-sheet-eyebrow {
  display: inline-block;
  margin-bottom: 6px;
  color: rgba(246, 237, 216, 0.5);
  font-size: 0.74rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.sound-sheet-header h3 {
  margin: 0;
  font-size: 1.1rem;
}

.sound-sheet-close {
  padding: 10px 14px;
  border: 0;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  color: #f6edd8;
}

.sound-sheet-current {
  display: flex;
  align-items: center;
  gap: 10px;
  color: rgba(246, 237, 216, 0.72);
  font-size: 0.92rem;
}

.sound-sheet-current strong {
  color: #f6edd8;
}

.sound-options-grid {
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 2px 4px 2px 2px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  box-sizing: border-box;
  align-content: start;
  scrollbar-gutter: stable;
  scrollbar-width: thin;
  scrollbar-color: rgba(223, 172, 83, 0.62) rgba(255, 255, 255, 0.05);
}

.sound-options-grid::-webkit-scrollbar {
  width: 10px;
}

.sound-options-grid::-webkit-scrollbar-track {
  border-radius: 999px;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.05),
    rgba(255, 255, 255, 0.02)
  );
}

.sound-options-grid::-webkit-scrollbar-thumb {
  border: 2px solid rgba(18, 15, 12, 0.92);
  border-radius: 999px;
  background: linear-gradient(
    180deg,
    rgba(235, 189, 98, 0.9),
    rgba(160, 109, 37, 0.92)
  );
  box-shadow:
    inset 0 1px 0 rgba(255, 244, 220, 0.22),
    0 0 0 1px rgba(255, 214, 133, 0.08);
}

.sound-options-grid::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(
    180deg,
    rgba(247, 203, 119, 0.96),
    rgba(184, 126, 44, 0.96)
  );
}

.sound-option {
  padding: 14px;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.03);
  color: #fff6e8;
  display: grid;
  gap: 8px;
  text-align: left;
  min-height: 124px;
  transition:
    transform 140ms ease,
    border-color 140ms ease,
    background-color 140ms ease;
}

.sound-option:hover {
  transform: translateY(-1px);
  border-color: rgba(223, 172, 83, 0.34);
  background: rgba(223, 172, 83, 0.08);
}

.sound-option.active {
  border-color: rgba(223, 172, 83, 0.58);
  background: rgba(223, 172, 83, 0.14);
}

.sound-option-main {
  display: grid;
  gap: 4px;
}

.sound-option-label {
  font-size: 0.98rem;
}

.sound-option-subtitle {
  color: rgba(246, 237, 216, 0.72);
  font-size: 0.78rem;
  line-height: 1.35;
}

.sound-option-preview {
  color: rgba(246, 237, 216, 0.9);
  font-size: 0.78rem;
  line-height: 1.42;
}

.sheet-fade-enter-active,
.sheet-fade-leave-active {
  transition: opacity 180ms ease;
}

.sheet-fade-enter-from,
.sheet-fade-leave-to {
  opacity: 0;
}

.sound-sheet-enter-active,
.sound-sheet-leave-active {
  transition:
    opacity 220ms ease,
    transform 220ms cubic-bezier(0.22, 1, 0.36, 1);
}

.sound-sheet-enter-from,
.sound-sheet-leave-to {
  opacity: 0;
  transform: translateY(28px);
}

@media (max-width: 760px) {
  .sound-options-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .sound-sheet-panel {
    height: min(58vh, 580px);
    padding: 18px 16px 22px;
    border-radius: 24px 24px 0 0;
  }
}
</style>
