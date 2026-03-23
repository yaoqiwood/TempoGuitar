<script setup lang="ts">
import { computed } from "vue";
import type { NoteSubdivisionId } from "../types/subdivision";
import quarterPng from "../assets/notation/quarter.png";
import eighthPng from "../assets/notation/eighth.png";
import eighthTripletPng from "../assets/notation/eighth-triplet.png";
import eighthTripletRestPng from "../assets/notation/eighth-triplet-rest.png";
import sixteenthPng from "../assets/notation/sixteenth.png";
import sixteenthRestPng from "../assets/notation/sixteenth-rest.png";

const props = withDefaults(
  defineProps<{
    variant: NoteSubdivisionId;
    width?: number;
    height?: number;
  }>(),
  {
    width: 96,
    height: 56,
  },
);

const glyphSources: Record<NoteSubdivisionId, string> = {
  quarter: quarterPng,
  eighth: eighthPng,
  "eighth-triplet": eighthTripletPng,
  "eighth-triplet-rest": eighthTripletRestPng,
  sixteenth: sixteenthPng,
  "sixteenth-rest": sixteenthRestPng,
};

const glyphSrc = computed(() => glyphSources[props.variant]);
const hostStyle = computed(() => ({
  width: `${props.width}px`,
  height: `${props.height}px`,
}));
</script>

<template>
  <span class="notation-glyph" :style="hostStyle" aria-hidden="true">
    <img class="notation-glyph-image" :src="glyphSrc" alt="" draggable="false" />
  </span>
</template>

<style scoped>
.notation-glyph {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 0;
  box-sizing: border-box;
  flex: none;
  overflow: visible;
}

.notation-glyph-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  pointer-events: none;
  user-select: none;
  -webkit-user-drag: none;
}
</style>
