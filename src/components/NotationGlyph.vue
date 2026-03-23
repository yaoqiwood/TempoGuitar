<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import {
  Beam,
  Formatter,
  Fraction,
  Renderer,
  Stave,
  StaveNote,
  Tuplet,
  Voice,
} from "vexflow";

type NotationVariant =
  | "quarter"
  | "eighth"
  | "eighth-triplet"
  | "eighth-triplet-rest"
  | "sixteenth"
  | "sixteenth-rest";

const props = withDefaults(
  defineProps<{
    variant: NotationVariant;
    width?: number;
    height?: number;
  }>(),
  {
    width: 96,
    height: 56,
  },
);

const host = ref<HTMLDivElement | null>(null);
let renderVersion = 0;

function getScaleFactor() {
  switch (props.variant) {
    case "quarter":
      return 2.4;
    case "eighth":
      return 2.2;
    case "eighth-triplet":
    case "eighth-triplet-rest":
      return 2.1;
    case "sixteenth":
    case "sixteenth-rest":
      return 2;
    default:
      return 2.1;
  }
}

function createQuarterNote() {
  return [new StaveNote({ keys: ["b/4"], duration: "4", stemDirection: 1 })];
}

function createEighthNotes() {
  return [
    new StaveNote({ keys: ["b/4"], duration: "8", stemDirection: 1 }),
    new StaveNote({ keys: ["b/4"], duration: "8", stemDirection: 1 }),
  ];
}

function createTripletNotes(withRest: boolean) {
  return [
    new StaveNote({ keys: ["b/4"], duration: "8", stemDirection: 1 }),
    new StaveNote({
      keys: [withRest ? "b/4" : "b/4"],
      duration: withRest ? "8r" : "8",
      stemDirection: 1,
    }),
    new StaveNote({ keys: ["b/4"], duration: "8", stemDirection: 1 }),
  ];
}

function createSixteenthNotes(withRests: boolean) {
  return [
    new StaveNote({ keys: ["b/4"], duration: "16", stemDirection: 1 }),
    new StaveNote({
      keys: ["b/4"],
      duration: withRests ? "16r" : "16",
      stemDirection: 1,
    }),
    new StaveNote({
      keys: ["b/4"],
      duration: withRests ? "16r" : "16",
      stemDirection: 1,
    }),
    new StaveNote({ keys: ["b/4"], duration: "16", stemDirection: 1 }),
  ];
}

function createNotation() {
  switch (props.variant) {
    case "quarter":
      return {
        notes: createQuarterNote(),
        beams: [] as Beam[],
        tuplet: null as Tuplet | null,
      };
    case "eighth": {
      const notes = createEighthNotes();

      return {
        notes,
        beams: Beam.generateBeams(notes, {
          groups: [new Fraction(1, 4)],
          stemDirection: 1,
        }),
        tuplet: null as Tuplet | null,
      };
    }
    case "eighth-triplet":
    case "eighth-triplet-rest": {
      const notes = createTripletNotes(props.variant === "eighth-triplet-rest");

      return {
        notes,
        beams: Beam.generateBeams(notes, {
          groups: [new Fraction(3, 8)],
          beamRests: props.variant === "eighth-triplet-rest",
          beamMiddleOnly: true,
          showStemlets: props.variant === "eighth-triplet-rest",
          stemDirection: 1,
        }),
        tuplet: new Tuplet(notes, {
          numNotes: 3,
          notesOccupied: 2,
          bracketed: true,
        }),
      };
    }
    case "sixteenth":
    case "sixteenth-rest": {
      const notes = createSixteenthNotes(props.variant === "sixteenth-rest");

      return {
        notes,
        beams: Beam.generateBeams(notes, {
          groups: [new Fraction(1, 4)],
          beamRests: props.variant === "sixteenth-rest",
          beamMiddleOnly: true,
          showStemlets: props.variant === "sixteenth-rest",
          stemDirection: 1,
        }),
        tuplet: null as Tuplet | null,
      };
    }
    default:
      return {
        notes: createQuarterNote(),
        beams: [] as Beam[],
        tuplet: null as Tuplet | null,
      };
  }
}

async function renderNotation() {
  const currentVersion = ++renderVersion;

  if ("fonts" in document) {
    await document.fonts.ready;
  }

  if (currentVersion !== renderVersion || !host.value) {
    return;
  }

  host.value.replaceChildren();

  const renderer = new Renderer(host.value, Renderer.Backends.SVG);
  renderer.resize(props.width, props.height);

  const context = renderer.getContext();
  const stave = new Stave(2, 12, props.width - 4, {
    leftBar: false,
    rightBar: false,
    spaceAboveStaffLn: 0,
    spaceBelowStaffLn: 0,
    spacingBetweenLinesPx: 8,
  });

  stave.setContext(context);
  stave.setConfigForLines(
    Array.from({ length: 5 }, () => ({
      visible: false,
    })),
  );
  stave.setNoteStartX(10);

  const { notes, beams, tuplet } = createNotation();
  const voice = new Voice({
    numBeats: 4,
    beatValue: 4,
  });

  voice.setMode(Voice.Mode.SOFT);
  voice.addTickables(notes);

  notes.forEach((note) => note.setStave(stave));

  new Formatter().joinVoices([voice]).formatToStave([voice], stave);
  voice.draw(context, stave);

  beams.forEach((beam) => {
    beam.setContext(context).draw();
  });

  if (tuplet) {
    tuplet.setContext(context).draw();
  }

  const svg = host.value.querySelector("svg");

  if (svg) {
    const scaleFactor = getScaleFactor();
    const contentBox = svg.getBBox();
    const paddingX = props.variant === "quarter" ? 10 : 8;
    const paddingTop = props.variant.includes("triplet") ? 10 : 6;
    const paddingBottom = 6;
    const baseViewBoxX = contentBox.x - paddingX;
    const baseViewBoxY = contentBox.y - paddingTop;
    const baseViewBoxWidth = Math.max(1, contentBox.width + paddingX * 2);
    const baseViewBoxHeight = Math.max(
      1,
      contentBox.height + paddingTop + paddingBottom,
    );

    const viewBoxWidth = baseViewBoxWidth / scaleFactor;
    const viewBoxHeight = baseViewBoxHeight / scaleFactor;
    const viewBoxX = baseViewBoxX;
    const viewBoxY =
      baseViewBoxY + (baseViewBoxHeight - viewBoxHeight) / 2;

    svg.setAttribute(
      "viewBox",
      `${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}`,
    );
    svg.setAttribute("width", String(props.width));
    svg.setAttribute("height", String(props.height));
    svg.setAttribute("preserveAspectRatio", "xMinYMid meet");
    svg.classList.add("notation-svg");
  }
}

onMounted(() => {
  void renderNotation();
});

watch(
  () => [props.variant, props.width, props.height],
  () => {
    void renderNotation();
  },
);

onBeforeUnmount(() => {
  renderVersion += 1;
});
</script>

<template>
  <div ref="host" class="notation-glyph" aria-hidden="true"></div>
</template>

<style scoped>
.notation-glyph {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  line-height: 0;
  color: currentColor;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
}

:deep(.notation-svg) {
  display: block;
  width: 100%;
  height: 100%;
  max-width: none;
  max-height: none;
  flex: none;
}

:deep(.notation-svg .vf-notehead),
:deep(.notation-svg .vf-notehead path),
:deep(.notation-svg .vf-stem),
:deep(.notation-svg .vf-stem path),
:deep(.notation-svg .vf-beam),
:deep(.notation-svg .vf-beam path),
:deep(.notation-svg .vf-stavenote),
:deep(.notation-svg .vf-stavenote path),
:deep(.notation-svg .vf-stavenote g),
:deep(.notation-svg .vf-tuplet),
:deep(.notation-svg .vf-tuplet path),
:deep(.notation-svg text) {
  fill: currentColor !important;
  stroke: currentColor !important;
}

:deep(.notation-svg .vf-stem),
:deep(.notation-svg .vf-stem path),
:deep(.notation-svg .vf-beam),
:deep(.notation-svg .vf-beam path),
:deep(.notation-svg .vf-tuplet path) {
  stroke-width: 1.2px;
}
</style>
