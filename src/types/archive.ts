import type { SoundPackId } from "./sound-pack";
import type { NoteSubdivisionId } from "./subdivision";
import type { TimeSignatureId } from "./time-signature";

export type ArchiveActionStatus = "idle" | "saved" | "loaded" | "error";

export type MetronomeSettingsSnapshot = {
  bpm: number;
  timeSignatureId: TimeSignatureId;
  subdivisionId: NoteSubdivisionId;
  soundPackId: SoundPackId;
  metronomeVolumePercent: number;
};

export type SavedMetronomeArchive = MetronomeSettingsSnapshot & {
  id: string;
  name: string;
  createdAtIso: string;
  updatedAtIso: string;
};

export type SavedMetronomeArchiveStore = {
  activeArchiveId: string | null;
  archives: SavedMetronomeArchive[];
};
