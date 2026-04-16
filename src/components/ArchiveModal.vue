<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import type { ArchiveActionStatus } from "../types/archive";

type ArchiveSummaryOption = {
  id: string;
  name: string;
  description: string;
  updatedAtText: string;
};

const props = defineProps<{
  open: boolean;
  archives: ArchiveSummaryOption[];
  selectedArchiveId: string | null;
  status: ArchiveActionStatus;
  currentSnapshotText: string;
}>();

const emit = defineEmits<{
  close: [];
  selectArchive: [id: string];
  createArchive: [name: string];
  saveSelected: [];
  loadSelected: [];
  deleteArchive: [id: string];
}>();

const selectMenuOpen = ref(false);
const createDialogOpen = ref(false);
const deleteConfirmOpen = ref(false);
const newArchiveName = ref("");
const newArchiveError = ref("");
const selectRoot = ref<HTMLElement | null>(null);
const newArchiveInput = ref<HTMLInputElement | null>(null);
const archivePendingDeleteId = ref<string | null>(null);

const selectedArchive = computed(
  () =>
    props.archives.find((archive) => archive.id === props.selectedArchiveId) ?? null,
);
const statusLabel = computed(() => {
  if (props.status === "saved") {
    return "存档已保存";
  }

  if (props.status === "loaded") {
    return "已完成读档";
  }

  if (props.status === "error") {
    return "操作失败，请检查存档后重试";
  }

  return "";
});

function closeSelectMenu() {
  selectMenuOpen.value = false;
}

function toggleSelectMenu() {
  if (!props.archives.length) {
    return;
  }

  selectMenuOpen.value = !selectMenuOpen.value;
}

function chooseArchive(id: string) {
  emit("selectArchive", id);
  closeSelectMenu();
}

function openCreateDialog() {
  createDialogOpen.value = true;
  selectMenuOpen.value = false;
}

function closeCreateDialog() {
  createDialogOpen.value = false;
  newArchiveName.value = "";
  newArchiveError.value = "";
}

function openDeleteConfirm(id: string) {
  archivePendingDeleteId.value = id;
  deleteConfirmOpen.value = true;
  closeSelectMenu();
}

function closeDeleteConfirm() {
  deleteConfirmOpen.value = false;
  archivePendingDeleteId.value = null;
}

function confirmDeleteArchive() {
  if (!archivePendingDeleteId.value) {
    return;
  }

  emit("deleteArchive", archivePendingDeleteId.value);
  closeDeleteConfirm();
}

function submitNewArchive() {
  const nextName = newArchiveName.value.trim();

  if (!nextName) {
    newArchiveError.value = "请输入存档名";
    return;
  }

  if (
    props.archives.some(
      (archive) => archive.name.toLocaleLowerCase() === nextName.toLocaleLowerCase(),
    )
  ) {
    newArchiveError.value = "这个存档名已存在，请换一个名字";
    return;
  }

  emit("createArchive", nextName);
  closeCreateDialog();
}

function handleDocumentPointerDown(event: PointerEvent) {
  if (!selectMenuOpen.value) {
    return;
  }

  const root = selectRoot.value;

  if (!root || root.contains(event.target as Node)) {
    return;
  }

  closeSelectMenu();
}

watch(
  () => props.open,
  (open) => {
    if (open) {
      return;
    }

    closeSelectMenu();
    closeCreateDialog();
    closeDeleteConfirm();
  },
);

watch(createDialogOpen, (open) => {
  if (!open) {
    return;
  }

  void nextTick(() => {
    newArchiveInput.value?.focus();
    newArchiveInput.value?.select();
  });
});

watch(newArchiveName, () => {
  if (newArchiveError.value) {
    newArchiveError.value = "";
  }
});

onMounted(() => {
  document.addEventListener("pointerdown", handleDocumentPointerDown);
});

onBeforeUnmount(() => {
  document.removeEventListener("pointerdown", handleDocumentPointerDown);
});
</script>

<template>
  <Transition name="sheet-fade">
    <div v-if="open" class="archive-modal-overlay" @click.self="emit('close')">
      <Transition name="archive-modal">
        <section
          v-if="open"
          class="archive-modal-panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby="archive-modal-title"
        >
          <div class="archive-modal-header">
            <div>
              <span class="archive-modal-eyebrow">Archive Center</span>
              <h3 id="archive-modal-title">存档管理</h3>
            </div>
            <button class="archive-modal-close" type="button" @click="emit('close')">
              关闭
            </button>
          </div>

          <div class="archive-current-card">
            <span class="archive-current-label">当前参数</span>
            <strong>{{ currentSnapshotText }}</strong>
          </div>

          <p v-if="status !== 'idle'" :class="['archive-status', `is-${status}`]">
            {{ statusLabel }}
          </p>

          <div class="archive-section">
            <span class="archive-section-label">已保存的存档</span>

            <div ref="selectRoot" class="archive-select">
              <button
                class="archive-select-trigger"
                type="button"
                :disabled="!archives.length"
                @click="toggleSelectMenu"
              >
                <div class="archive-select-copy">
                  <strong>{{
                    selectedArchive?.name ?? (archives.length ? "选择一个存档" : "暂无存档")
                  }}</strong>
                  <span>{{
                    selectedArchive?.description ??
                    (archives.length ? "可读档或覆盖当前设置" : "先新建一个存档")
                  }}</span>
                </div>
                <span class="archive-select-caret">
                  {{ selectMenuOpen ? "^" : "v" }}
                </span>
              </button>

              <Transition name="archive-dropdown">
                <div v-if="selectMenuOpen && archives.length" class="archive-select-menu">
                  <button
                    v-for="archive in archives"
                    :key="archive.id"
                    :class="[
                      'archive-select-option',
                      {
                        active: archive.id === selectedArchiveId,
                      },
                    ]"
                    type="button"
                    @click="chooseArchive(archive.id)"
                  >
                    <div class="archive-select-option-row">
                      <div class="archive-select-option-main">
                        <strong>{{ archive.name }}</strong>
                        <span>{{ archive.description }}</span>
                      </div>
                      <button
                        class="archive-delete-button"
                        type="button"
                        aria-label="删除存档"
                        @click.stop="openDeleteConfirm(archive.id)"
                      >
                        X
                      </button>
                    </div>
                    <small>{{ archive.updatedAtText }}</small>
                  </button>
                </div>
              </Transition>
            </div>
          </div>

          <div v-if="selectedArchive" class="archive-selected-card">
            <div>
              <span class="archive-selected-label">当前选中： </span> 
              <strong>{{ selectedArchive.name }}</strong>
            </div>
            <span class="archive-selected-time">{{ selectedArchive.updatedAtText }}</span>
          </div>

          <div class="archive-actions">
            <button
              class="archive-action-button archive-action-button-secondary"
              type="button"
              @click="openCreateDialog"
            >
              新建存档
            </button>
            <button
              class="archive-action-button archive-action-button-muted"
              type="button"
              :disabled="!selectedArchive"
              @click="emit('saveSelected')"
            >
              覆盖存档
            </button>
            <button
              class="archive-action-button archive-action-button-primary"
              type="button"
              :disabled="!selectedArchive"
              @click="emit('loadSelected')"
            >
              读档
            </button>
          </div>

          <Transition name="sheet-fade">
            <div
              v-if="createDialogOpen"
              class="archive-create-overlay"
              @click.self="closeCreateDialog"
            >
              <section class="archive-create-dialog">
                <h4>新建存档</h4>
                <p>输入一个新的存档名，当前节拍参数会保存到这个存档里。</p>
                <input
                  ref="newArchiveInput"
                  v-model="newArchiveName"
                  class="archive-create-input"
                  type="text"
                  maxlength="32"
                  placeholder="例如：扫弦练习 / 节奏 120"
                  @keydown.enter.prevent="submitNewArchive"
                />
                <p v-if="newArchiveError" class="archive-create-error">
                  {{ newArchiveError }}
                </p>
                <div class="archive-create-actions">
                  <button
                    class="archive-create-button archive-create-button-secondary"
                    type="button"
                    @click="closeCreateDialog"
                  >
                    取消
                  </button>
                  <button
                    class="archive-create-button archive-create-button-primary"
                    type="button"
                    :disabled="!newArchiveName.trim()"
                    @click="submitNewArchive"
                  >
                    保存
                  </button>
                </div>
              </section>
            </div>
          </Transition>

          <Transition name="sheet-fade">
            <div
              v-if="deleteConfirmOpen"
              class="archive-create-overlay"
              @click.self="closeDeleteConfirm"
            >
              <section class="archive-create-dialog">
                <h4>确认删除存档？</h4>
                <p>删除后无法恢复，是否继续？</p>
                <div class="archive-create-actions">
                  <button
                    class="archive-create-button archive-create-button-secondary"
                    type="button"
                    @click="closeDeleteConfirm"
                  >
                    否
                  </button>
                  <button
                    class="archive-create-button archive-create-button-danger"
                    type="button"
                    @click="confirmDeleteArchive"
                  >
                    确认
                  </button>
                </div>
              </section>
            </div>
          </Transition>
        </section>
      </Transition>
    </div>
  </Transition>
</template>

<style scoped>
.archive-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 98;
  background: rgba(7, 6, 5, 0.58);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  display: grid;
  place-items: center;
  padding: 16px;
  box-sizing: border-box;
}

.archive-modal-panel {
  position: relative;
  width: min(520px, 100%);
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background:
    radial-gradient(circle at top right, rgba(223, 172, 83, 0.14), transparent 34%),
    linear-gradient(180deg, rgba(32, 26, 21, 0.98), rgba(14, 11, 9, 0.99));
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.38);
  padding: 18px;
  display: grid;
  gap: 14px;
}

.archive-modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.archive-modal-eyebrow {
  display: inline-block;
  margin-bottom: 6px;
  color: rgba(246, 237, 216, 0.54);
  font-size: 0.74rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.archive-modal-header h3 {
  margin: 0;
  font-size: 1.14rem;
  color: #fff3e2;
}

.archive-modal-close {
  border: 0;
  border-radius: 999px;
  min-height: 36px;
  padding: 0 14px;
  background: rgba(255, 255, 255, 0.08);
  color: #f6edd8;
}

.archive-current-card,
.archive-selected-card {
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.04);
  padding: 14px 16px;
}

.archive-current-card {
  display: grid;
  gap: 6px;
}

.archive-current-label,
.archive-selected-label,
.archive-section-label {
  color: rgba(246, 237, 216, 0.62);
  font-size: 0.8rem;
  letter-spacing: 0.04em;
}

.archive-current-card strong,
.archive-selected-card strong {
  color: #fff3e2;
  line-height: 1.5;
}

.archive-status {
  margin: 0;
  padding: 10px 12px;
  border-radius: 14px;
  font-size: 0.84rem;
  line-height: 1.45;
}

.archive-status.is-saved {
  background: rgba(83, 197, 123, 0.16);
  color: #cbffd6;
}

.archive-status.is-loaded {
  background: rgba(73, 162, 255, 0.16);
  color: #d6ebff;
}

.archive-status.is-error {
  background: rgba(226, 84, 84, 0.16);
  color: #ffd6d6;
}

.archive-section {
  display: grid;
  gap: 10px;
}

.archive-select {
  position: relative;
}

.archive-select-trigger {
  width: 100%;
  border: 1px solid rgba(223, 172, 83, 0.2);
  border-radius: 18px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.03)),
    rgba(255, 255, 255, 0.02);
  color: #fff6e8;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  text-align: left;
  transition:
    border-color 140ms ease,
    transform 140ms ease,
    box-shadow 140ms ease;
}

.archive-select-trigger:hover:not(:disabled) {
  transform: translateY(-1px);
  border-color: rgba(223, 172, 83, 0.36);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.16);
}

.archive-select-trigger:disabled {
  opacity: 0.62;
  cursor: not-allowed;
}

.archive-select-copy {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.archive-select-copy strong,
.archive-select-option-main strong {
  color: #fff3e2;
  font-size: 0.96rem;
}

.archive-select-copy span,
.archive-select-option-main span,
.archive-selected-time,
.archive-select-option small {
  color: rgba(246, 237, 216, 0.7);
  font-size: 0.8rem;
  line-height: 1.45;
}

.archive-select-caret {
  font-size: 0.94rem;
  color: rgba(255, 233, 191, 0.92);
}

.archive-select-menu {
  position: absolute;
  top: calc(100% + 10px);
  left: 0;
  right: 0;
  z-index: 2;
  max-height: 260px;
  overflow-y: auto;
  padding: 8px;
  border-radius: 18px;
  border: 1px solid rgba(223, 172, 83, 0.18);
  background: rgba(21, 17, 14, 0.98);
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.32);
  display: grid;
  gap: 8px;
  scrollbar-width: thin;
  scrollbar-color: rgba(223, 172, 83, 0.62) rgba(255, 255, 255, 0.05);
}

.archive-select-option {
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.03);
  color: #fff6e8;
  padding: 12px;
  display: grid;
  gap: 6px;
  text-align: left;
  transition:
    background-color 140ms ease,
    border-color 140ms ease,
    transform 140ms ease;
}

.archive-select-option:hover {
  transform: translateY(-1px);
  border-color: rgba(223, 172, 83, 0.34);
  background: rgba(223, 172, 83, 0.08);
}

.archive-select-option.active {
  border-color: rgba(223, 172, 83, 0.58);
  background: rgba(223, 172, 83, 0.14);
}

.archive-select-option-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.archive-select-option-main {
  display: grid;
  gap: 3px;
  min-width: 0;
}

.archive-delete-button {
  flex: none;
  width: 28px;
  height: 28px;
  border: 0;
  border-radius: 999px;
  background: rgba(226, 84, 84, 0.16);
  color: #ffd4d4;
  font-size: 0.82rem;
  font-weight: 700;
  line-height: 1;
  transition:
    background-color 140ms ease,
    transform 140ms ease;
}

.archive-delete-button:hover {
  background: rgba(226, 84, 84, 0.28);
  transform: translateY(-1px);
}

.archive-selected-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.archive-actions {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.archive-action-button,
.archive-create-button {
  border: 0;
  border-radius: 14px;
  min-height: 46px;
  padding: 0 14px;
  font-weight: 600;
  transition:
    transform 140ms ease,
    background-color 140ms ease,
    color 140ms ease;
}

.archive-action-button:hover:not(:disabled),
.archive-create-button:hover:not(:disabled) {
  transform: translateY(-1px);
}

.archive-action-button:disabled {
  opacity: 0.48;
  cursor: not-allowed;
}

.archive-action-button-secondary {
  background: rgba(255, 255, 255, 0.08);
  color: #f6edd8;
}

.archive-action-button-secondary:hover {
  background: rgba(255, 255, 255, 0.14);
}

.archive-action-button-muted {
  background: rgba(223, 172, 83, 0.15);
  color: #ffe4b2;
}

.archive-action-button-muted:hover {
  background: rgba(223, 172, 83, 0.24);
}

.archive-action-button-primary,
.archive-create-button-primary {
  background: linear-gradient(135deg, #dfac53, #b97c30);
  color: #1e140c;
}

.archive-action-button-primary:hover,
.archive-create-button-primary:hover {
  background: linear-gradient(135deg, #ebbb67, #c88939);
}

.archive-create-button-danger {
  background: rgba(184, 72, 72, 0.22);
  color: #ffd9d9;
}

.archive-create-button-danger:hover {
  background: rgba(184, 72, 72, 0.32);
}

.archive-create-overlay {
  position: absolute;
  inset: 0;
  border-radius: 24px;
  background: rgba(8, 7, 6, 0.72);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  display: grid;
  place-items: center;
  padding: 18px;
  box-sizing: border-box;
}

.archive-create-dialog {
  width: min(360px, 100%);
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: linear-gradient(
    180deg,
    rgba(38, 29, 24, 0.98),
    rgba(18, 14, 12, 0.99)
  );
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.34);
  padding: 18px;
  display: grid;
  gap: 12px;
}

.archive-create-dialog h4 {
  margin: 0;
  color: #fff3e2;
  font-size: 1rem;
}

.archive-create-dialog p {
  margin: 0;
  color: rgba(246, 237, 216, 0.68);
  font-size: 0.84rem;
  line-height: 1.5;
}

.archive-create-error {
  margin: -4px 0 0;
  color: #ffd4d4;
  font-size: 0.78rem;
}

.archive-create-input {
  width: 100%;
  min-height: 44px;
  box-sizing: border-box;
  border: 1px solid rgba(223, 172, 83, 0.26);
  border-radius: 12px;
  padding: 0 14px;
  background: rgba(255, 255, 255, 0.05);
  color: #fff3e2;
  outline: none;
  transition:
    border-color 140ms ease,
    box-shadow 140ms ease;
}

.archive-create-input:focus {
  border-color: rgba(223, 172, 83, 0.58);
  box-shadow: 0 0 0 3px rgba(223, 172, 83, 0.12);
}

.archive-create-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.archive-create-button-secondary {
  background: rgba(255, 255, 255, 0.08);
  color: #f6edd8;
}

.archive-create-button-secondary:hover {
  background: rgba(255, 255, 255, 0.14);
}

.sheet-fade-enter-active,
.sheet-fade-leave-active {
  transition: opacity 180ms ease;
}

.sheet-fade-enter-from,
.sheet-fade-leave-to {
  opacity: 0;
}

.archive-modal-enter-active,
.archive-modal-leave-active {
  transition:
    opacity 220ms ease,
    transform 220ms cubic-bezier(0.22, 1, 0.36, 1);
}

.archive-modal-enter-from,
.archive-modal-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.98);
}

.archive-dropdown-enter-active,
.archive-dropdown-leave-active {
  transition:
    opacity 160ms ease,
    transform 160ms ease;
}

.archive-dropdown-enter-from,
.archive-dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

@media (max-width: 640px) {
  .archive-modal-panel {
    padding: 16px;
  }

  .archive-actions {
    grid-template-columns: 1fr;
  }

  .archive-selected-card {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
