export type NoteSubdivisionId =
  | "quarter"
  | "eighth"
  | "eighth-triplet"
  | "eighth-triplet-rest"
  | "sixteenth"
  | "sixteenth-rest";

export type NoteSubdivisionOption = {
  id: NoteSubdivisionId;
  label: string;
  shortLabel: string;
};

export type SubdivisionPattern = {
  pulsesPerBeat: number;
  activePulseIndexes: number[];
};

export const subdivisionOptions: NoteSubdivisionOption[] = [
  {
    id: "quarter",
    label: "4分音符",
    shortLabel: "4分",
  },
  {
    id: "eighth",
    label: "8分音符",
    shortLabel: "8分",
  },
  {
    id: "eighth-triplet",
    label: "8分音三连音",
    shortLabel: "3连音",
  },
  {
    id: "eighth-triplet-rest",
    label: "8分音三连音中间空一拍",
    shortLabel: "3连音空1",
  },
  {
    id: "sixteenth",
    label: "16分音符",
    shortLabel: "16分",
  },
  {
    id: "sixteenth-rest",
    label: "16分音符中间空两拍",
    shortLabel: "16分空2",
  },
];

export const subdivisionPatterns: Record<NoteSubdivisionId, SubdivisionPattern> = {
  quarter: {
    pulsesPerBeat: 1,
    activePulseIndexes: [0],
  },
  eighth: {
    pulsesPerBeat: 2,
    activePulseIndexes: [0, 1],
  },
  "eighth-triplet": {
    pulsesPerBeat: 3,
    activePulseIndexes: [0, 1, 2],
  },
  "eighth-triplet-rest": {
    pulsesPerBeat: 3,
    activePulseIndexes: [0, 2],
  },
  sixteenth: {
    pulsesPerBeat: 4,
    activePulseIndexes: [0, 1, 2, 3],
  },
  "sixteenth-rest": {
    pulsesPerBeat: 4,
    activePulseIndexes: [0, 3],
  },
};
