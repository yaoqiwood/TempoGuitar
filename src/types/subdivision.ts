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
  accentDescription: string;
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
    accentDescription: "每拍落点清晰，拍头重，适合基础稳拍练习",
  },
  {
    id: "eighth",
    label: "8分音符",
    shortLabel: "8分",
    accentDescription: "每拍前半拍重，后半拍轻，适合均匀下上拨训练",
  },
  {
    id: "eighth-triplet",
    label: "8分音三连音",
    shortLabel: "3连音",
    accentDescription: "每拍三等分，首音重，后两音轻，突出三连律动",
  },
  {
    id: "eighth-triplet-rest",
    label: "8分音三连音中间空一拍",
    shortLabel: "3连音空1",
    accentDescription: "每拍首尾发声，中间留空，重音更偏向切分感",
  },
  {
    id: "sixteenth",
    label: "16分音符",
    shortLabel: "16分",
    accentDescription: "每拍四等分，首音重，其余轻，适合密集分解练习",
  },
  {
    id: "sixteenth-rest",
    label: "16分音符中间空两拍",
    shortLabel: "16分空2",
    accentDescription: "每拍首尾发声，中间两格留空，强化前后点控制",
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
