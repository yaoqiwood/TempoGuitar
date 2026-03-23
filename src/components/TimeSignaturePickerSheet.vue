<script setup lang="ts">
import type {
  TimeSignatureId,
  TimeSignatureOption,
} from "../types/time-signature";

defineProps<{
  open: boolean;
  currentTimeSignatureId: TimeSignatureId;
  currentTimeSignatureLabel: string;
  options: TimeSignatureOption[];
}>();

const emit = defineEmits<{
  close: [];
  select: [id: TimeSignatureId];
}>();
</script>

<template>
  <Transition name="sheet-fade">
    <div v-if="open" class="signature-sheet-overlay" @click.self="emit('close')">
      <Transition name="signature-sheet">
        <section v-if="open" class="signature-sheet-panel">
          <div class="signature-sheet-header">
            <div>
              <span class="signature-sheet-eyebrow">Time Signature</span>
              <h3>Select Time Signature</h3>
            </div>
            <button
              class="signature-sheet-close"
              type="button"
              @click="emit('close')"
            >
              Close
            </button>
          </div>

          <div class="signature-sheet-current">
            <span>Current:</span>
            <strong>{{ currentTimeSignatureLabel }}</strong>
          </div>

          <div class="signature-options-grid">
            <button
              v-for="option in options"
              :key="option.id"
              :class="[
                'signature-option',
                {
                  active: option.id === currentTimeSignatureId,
                },
              ]"
              type="button"
              @click="emit('select', option.id)"
            >
              <span class="signature-option-main">{{ option.shortLabel }}</span>
              <span v-if="option.grouping" class="signature-option-sub">
                ({{ option.grouping.join("+") }})
              </span>
            </button>
          </div>
        </section>
      </Transition>
    </div>
  </Transition>
</template>

<style scoped>
.signature-sheet-overlay {
  position: fixed;
  inset: 0;
  background: rgba(7, 6, 5, 0.58);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 80;
}

.signature-sheet-panel {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: min(50vh, 480px);
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

.signature-sheet-header {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 12px;
}

.signature-sheet-eyebrow {
  display: inline-block;
  margin-bottom: 6px;
  color: rgba(246, 237, 216, 0.5);
  font-size: 0.74rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.signature-sheet-header h3 {
  margin: 0;
  font-size: 1.1rem;
}

.signature-sheet-close {
  padding: 10px 14px;
  border: 0;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  color: #f6edd8;
}

.signature-sheet-current {
  display: flex;
  align-items: center;
  gap: 10px;
  color: rgba(246, 237, 216, 0.72);
  font-size: 0.92rem;
}

.signature-sheet-current strong {
  color: #f6edd8;
  font-size: 1.05rem;
  letter-spacing: 0.02em;
}

.signature-options-grid {
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 2px 4px 2px 2px;
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
  box-sizing: border-box;
  align-content: start;
  justify-items: stretch;
}

.signature-option {
  padding: 12px 6px;
  min-height: 68px;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.03);
  color: #fff6e8;
  display: grid;
  gap: 3px;
  align-content: center;
  justify-items: center;
  transition:
    transform 140ms ease,
    border-color 140ms ease,
    background-color 140ms ease;
}

.signature-option:hover {
  transform: translateY(-1px);
  border-color: rgba(223, 172, 83, 0.34);
  background: rgba(223, 172, 83, 0.08);
}

.signature-option.active {
  border-color: rgba(223, 172, 83, 0.58);
  background: rgba(223, 172, 83, 0.14);
  color: #fffbed;
}

.signature-option-main {
  font-size: 1.6rem;
  line-height: 1;
}

.signature-option-sub {
  font-size: 0.86rem;
  color: rgba(246, 237, 216, 0.82);
}

.sheet-fade-enter-active,
.sheet-fade-leave-active {
  transition: opacity 180ms ease;
}

.sheet-fade-enter-from,
.sheet-fade-leave-to {
  opacity: 0;
}

.signature-sheet-enter-active,
.signature-sheet-leave-active {
  transition:
    opacity 220ms ease,
    transform 220ms cubic-bezier(0.22, 1, 0.36, 1);
}

.signature-sheet-enter-from,
.signature-sheet-leave-to {
  opacity: 0;
  transform: translateY(28px);
}

@media (max-width: 760px) {
  .signature-options-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .signature-sheet-panel {
    height: min(58vh, 560px);
    padding: 18px 16px 22px;
    border-radius: 24px 24px 0 0;
  }

  .signature-options-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .signature-option {
    min-height: 64px;
  }

  .signature-option-main {
    font-size: 1.35rem;
  }
}
</style>
