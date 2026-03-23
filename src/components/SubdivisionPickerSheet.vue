<script setup lang="ts">
import NotationGlyph from "./NotationGlyph.vue";
import type {
  NoteSubdivisionId,
  NoteSubdivisionOption,
} from "../types/subdivision";

defineProps<{
  open: boolean;
  currentSubdivisionId: NoteSubdivisionId;
  currentSubdivisionLabel: string;
  options: NoteSubdivisionOption[];
  glyphScaleAdjust?: number;
}>();

const emit = defineEmits<{
  close: [];
  select: [id: NoteSubdivisionId];
}>();
</script>

<template>
  <Transition name="sheet-fade">
    <div
      v-if="open"
      class="note-sheet-overlay"
      @click.self="emit('close')"
    >
      <Transition name="note-sheet">
        <section v-if="open" class="note-sheet-panel">
          <div class="note-sheet-header">
            <div>
              <span class="note-sheet-eyebrow">音符选择</span>
              <h3>选择节奏音符</h3>
            </div>
            <button
              class="note-sheet-close"
              type="button"
              @click="emit('close')"
            >
              关闭
            </button>
          </div>

          <div class="note-sheet-current">
            <span>当前：</span>
            <NotationGlyph
              class="note-glyph note-glyph-current"
              :variant="currentSubdivisionId"
              :width="112"
              :height="62"
              :scale-adjust="glyphScaleAdjust"
            />
            <strong>{{ currentSubdivisionLabel }}</strong>
          </div>

          <div class="note-select-popup">
            <button
              v-for="option in options"
              :key="option.id"
              :class="[
                'note-option',
                {
                  active: option.id === currentSubdivisionId,
                },
              ]"
              type="button"
              @click="emit('select', option.id)"
            >
              <NotationGlyph
                class="note-glyph note-glyph-option"
                :variant="option.id"
                :width="176"
                :height="92"
                :scale-adjust="glyphScaleAdjust"
              />
              <span class="note-option-label">{{ option.label }}</span>
            </button>
          </div>
        </section>
      </Transition>
    </div>
  </Transition>
</template>

<style scoped>
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
  display: flex;
  align-items: center;
  gap: 10px;
  color: rgba(246, 237, 216, 0.72);
  font-size: 0.92rem;
  flex-wrap: nowrap;
  min-height: 92px;
}

.note-sheet-current strong {
  color: #f6edd8;
}

.note-select-popup {
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 2px 4px 2px 2px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  box-sizing: border-box;
}

.note-option {
  padding: 16px 10px;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.03);
  color: #fff6e8;
  display: grid;
  grid-template-columns: 1fr;
  align-content: center;
  justify-items: center;
  gap: 8px;
  text-align: center;
  min-width: 0;
  overflow: hidden;
  box-sizing: border-box;
  min-height: 100px;
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
  color: #fffbed;
}

.note-option-label {
  display: block;
  width: 100%;
  min-width: 0;
  font-size: 0.78rem;
  line-height: 1.45;
  color: rgba(246, 237, 216, 0.86);
  white-space: normal;
  text-align: center;
}

.note-glyph {
  flex: none;
  color: #fff8ee;
  width: 148px;
  height: 82px;
}

.note-glyph-current {
  width: 126px;
  height: 76px;
}

.note-glyph-option {
  width: 176px;
  height: 98px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding-left: 20px;
  box-sizing: border-box;
  margin-bottom: 0;
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

@media (max-width: 640px) {
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
