import asyncio
import json
from array import array
from dataclasses import dataclass
from pathlib import Path
import wave

import edge_tts
import miniaudio


ROOT_DIR = Path(__file__).resolve().parent.parent
OUTPUT_DIR = ROOT_DIR / "src" / "assets" / "count-voice" / "equal"
TMP_DIR = ROOT_DIR / ".tmp" / "count-voice-equal"
VOICE = "en-US-JennyNeural"
TARGET_DURATION_SECONDS = 0.20
TARGET_ONSET_SECONDS = 0.012
SILENCE_THRESHOLD = 0.012
FADE_MS = 4
REQUEST_TIMEOUT_SECONDS = 20
MAX_RETRIES = 3


@dataclass(frozen=True)
class TokenSpec:
    key: str
    text: str
    rate: str
    pitch: str


TOKEN_SPECS = [
    TokenSpec("one", "one", "+44%", "+18Hz"),
    TokenSpec("two", "two", "+50%", "+18Hz"),
    TokenSpec("three", "three", "+96%", "+16Hz"),
    TokenSpec("four", "four", "+72%", "+16Hz"),
]


def clamp_sample(value: float) -> float:
    return max(-1.0, min(1.0, value))


def trim_and_pad(decoded: miniaudio.DecodedSoundFile) -> tuple[array, int, int]:
    samples = decoded.samples
    sample_rate = decoded.sample_rate
    target_frames = int(round(sample_rate * TARGET_DURATION_SECONDS))
    target_onset_frame = int(round(sample_rate * TARGET_ONSET_SECONDS))

    onset_frame = 0
    for index, sample in enumerate(samples):
        if abs(sample) >= SILENCE_THRESHOLD:
            onset_frame = index
            break

    crop_start = max(0, onset_frame - target_onset_frame)
    crop_end = min(len(samples), crop_start + target_frames)
    trimmed = array("f", samples[crop_start:crop_end])

    if len(trimmed) < target_frames:
        trimmed.extend([0.0] * (target_frames - len(trimmed)))

    fade_frames = min(target_frames // 2, int(round(sample_rate * FADE_MS / 1000)))
    for index in range(fade_frames):
        fade_in = index / max(1, fade_frames)
        trimmed[index] *= fade_in
        trimmed[-(index + 1)] *= fade_in

    pcm16 = array(
        "h",
        (
            max(-32768, min(32767, int(clamp_sample(sample) * 32767)))
            for sample in trimmed
        ),
    )
    return pcm16, onset_frame, sample_rate


def write_wav(output_path: Path, pcm16: array, sample_rate: int) -> None:
    with wave.open(str(output_path), "wb") as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(sample_rate)
        wav_file.writeframes(pcm16.tobytes())


async def synthesize_source(token: TokenSpec, output_path: Path) -> None:
    last_error: Exception | None = None

    for attempt in range(1, MAX_RETRIES + 1):
        communicator = edge_tts.Communicate(
            token.text,
            VOICE,
            rate=token.rate,
            pitch=token.pitch,
        )

        try:
            await asyncio.wait_for(
                communicator.save(str(output_path)),
                timeout=REQUEST_TIMEOUT_SECONDS,
            )
            return
        except Exception as error:
            last_error = error
            if output_path.exists():
                output_path.unlink()
            if attempt < MAX_RETRIES:
                await asyncio.sleep(0.8)

    if last_error:
        raise last_error


async def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    TMP_DIR.mkdir(parents=True, exist_ok=True)
    for stale_file in OUTPUT_DIR.glob("*.mp3"):
        stale_file.unlink()

    report: list[dict[str, float | str | int]] = []

    for token in TOKEN_SPECS:
        source_path = TMP_DIR / f"{token.key}.source.mp3"
        output_path = OUTPUT_DIR / f"{token.key}.wav"

        await synthesize_source(token, source_path)
        decoded = miniaudio.mp3_read_file_f32(str(source_path))
        pcm16, detected_onset_frame, sample_rate = trim_and_pad(decoded)
        write_wav(output_path, pcm16, sample_rate)

        final_duration = len(pcm16) / sample_rate
        report.append(
            {
                "key": token.key,
                "voice": VOICE,
                "text": token.text,
                "rate": token.rate,
                "pitch": token.pitch,
                "sampleRate": sample_rate,
                "targetDurationSeconds": TARGET_DURATION_SECONDS,
                "detectedOnsetSeconds": round(detected_onset_frame / sample_rate, 4),
                "finalWavDurationSeconds": round(final_duration, 4),
            },
        )

    (OUTPUT_DIR / "report.json").write_text(
        json.dumps(report, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    print(f"Generated {len(TOKEN_SPECS)} equal-duration count voice clips in {OUTPUT_DIR}")


if __name__ == "__main__":
    asyncio.run(main())
