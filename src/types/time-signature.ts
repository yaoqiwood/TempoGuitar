export type TimeSignatureId =
  | "1/2"
  | "2/2"
  | "3/2"
  | "4/2"
  | "5/2"
  | "6/2"
  | "7/2"
  | "8/2"
  | "9/2"
  | "10/2"
  | "11/2"
  | "12/2"
  | "13/2"
  | "1/4"
  | "2/4"
  | "3/4"
  | "4/4"
  | "5/4"
  | "6/4"
  | "7/4"
  | "8/4"
  | "9/4"
  | "10/4"
  | "11/4"
  | "12/4"
  | "13/4"
  | "3/8"
  | "6/8"
  | "9/8"
  | "12/8"
  | "5/8-3-2"
  | "5/8-2-3"
  | "7/8-3-2-2"
  | "7/8-2-3-2"
  | "7/8-2-2-3";

export type TimeSignatureOption = {
  id: TimeSignatureId;
  label: string;
  shortLabel: string;
  numerator: number;
  denominator: number;
  grouping?: number[];
};

export const timeSignatureOptions: TimeSignatureOption[] = [
  { id: "1/2", label: "1/2", shortLabel: "1/2", numerator: 1, denominator: 2 },
  { id: "2/2", label: "2/2", shortLabel: "2/2", numerator: 2, denominator: 2 },
  { id: "3/2", label: "3/2", shortLabel: "3/2", numerator: 3, denominator: 2 },
  { id: "4/2", label: "4/2", shortLabel: "4/2", numerator: 4, denominator: 2 },
  { id: "5/2", label: "5/2", shortLabel: "5/2", numerator: 5, denominator: 2 },
  { id: "6/2", label: "6/2", shortLabel: "6/2", numerator: 6, denominator: 2 },
  { id: "7/2", label: "7/2", shortLabel: "7/2", numerator: 7, denominator: 2 },
  { id: "8/2", label: "8/2", shortLabel: "8/2", numerator: 8, denominator: 2 },
  { id: "9/2", label: "9/2", shortLabel: "9/2", numerator: 9, denominator: 2 },
  {
    id: "10/2",
    label: "10/2",
    shortLabel: "10/2",
    numerator: 10,
    denominator: 2,
  },
  {
    id: "11/2",
    label: "11/2",
    shortLabel: "11/2",
    numerator: 11,
    denominator: 2,
  },
  {
    id: "12/2",
    label: "12/2",
    shortLabel: "12/2",
    numerator: 12,
    denominator: 2,
  },
  {
    id: "13/2",
    label: "13/2",
    shortLabel: "13/2",
    numerator: 13,
    denominator: 2,
  },
  { id: "1/4", label: "1/4", shortLabel: "1/4", numerator: 1, denominator: 4 },
  { id: "2/4", label: "2/4", shortLabel: "2/4", numerator: 2, denominator: 4 },
  { id: "3/4", label: "3/4", shortLabel: "3/4", numerator: 3, denominator: 4 },
  { id: "4/4", label: "4/4", shortLabel: "4/4", numerator: 4, denominator: 4 },
  { id: "5/4", label: "5/4", shortLabel: "5/4", numerator: 5, denominator: 4 },
  { id: "6/4", label: "6/4", shortLabel: "6/4", numerator: 6, denominator: 4 },
  { id: "7/4", label: "7/4", shortLabel: "7/4", numerator: 7, denominator: 4 },
  { id: "8/4", label: "8/4", shortLabel: "8/4", numerator: 8, denominator: 4 },
  { id: "9/4", label: "9/4", shortLabel: "9/4", numerator: 9, denominator: 4 },
  {
    id: "10/4",
    label: "10/4",
    shortLabel: "10/4",
    numerator: 10,
    denominator: 4,
  },
  {
    id: "11/4",
    label: "11/4",
    shortLabel: "11/4",
    numerator: 11,
    denominator: 4,
  },
  {
    id: "12/4",
    label: "12/4",
    shortLabel: "12/4",
    numerator: 12,
    denominator: 4,
  },
  {
    id: "13/4",
    label: "13/4",
    shortLabel: "13/4",
    numerator: 13,
    denominator: 4,
  },
  { id: "3/8", label: "3/8", shortLabel: "3/8", numerator: 3, denominator: 8 },
  { id: "6/8", label: "6/8", shortLabel: "6/8", numerator: 6, denominator: 8 },
  { id: "9/8", label: "9/8", shortLabel: "9/8", numerator: 9, denominator: 8 },
  {
    id: "12/8",
    label: "12/8",
    shortLabel: "12/8",
    numerator: 12,
    denominator: 8,
  },
  {
    id: "5/8-3-2",
    label: "5/8 (3+2)",
    shortLabel: "5/8",
    numerator: 5,
    denominator: 8,
    grouping: [3, 2],
  },
  {
    id: "5/8-2-3",
    label: "5/8 (2+3)",
    shortLabel: "5/8",
    numerator: 5,
    denominator: 8,
    grouping: [2, 3],
  },
  {
    id: "7/8-3-2-2",
    label: "7/8 (3+2+2)",
    shortLabel: "7/8",
    numerator: 7,
    denominator: 8,
    grouping: [3, 2, 2],
  },
  {
    id: "7/8-2-3-2",
    label: "7/8 (2+3+2)",
    shortLabel: "7/8",
    numerator: 7,
    denominator: 8,
    grouping: [2, 3, 2],
  },
  {
    id: "7/8-2-2-3",
    label: "7/8 (2+2+3)",
    shortLabel: "7/8",
    numerator: 7,
    denominator: 8,
    grouping: [2, 2, 3],
  },
];
