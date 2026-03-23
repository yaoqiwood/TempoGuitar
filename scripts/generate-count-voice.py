import asyncio
from pathlib import Path
import sys

import edge_tts


OUTPUT_DIR = Path(__file__).resolve().parent.parent / "src" / "assets" / "count-voice"
PHRASE_OUTPUT_DIR = OUTPUT_DIR / "phrases"
VOICE = "en-US-JennyNeural"
RATE = "+8%"

CLIPS = [
    {"key": "one", "text": "one.", "pitch": "+18Hz", "rate": "+14%"},
    {"key": "two", "text": "two.", "pitch": "+18Hz", "rate": "+14%"},
    {"key": "three", "text": "three.", "pitch": "+16Hz", "rate": "+18%"},
    {"key": "four", "text": "four.", "pitch": "+16Hz", "rate": "+18%"},
    {"key": "five", "text": "five", "pitch": "+4Hz", "rate": "+20%"},
    {"key": "six", "text": "six", "pitch": "+2Hz", "rate": "+24%"},
    {"key": "seven", "text": "seven", "pitch": "+2Hz", "rate": "+24%"},
    {"key": "eight", "text": "eight", "pitch": "+2Hz", "rate": "+24%"},
    {"key": "nine", "text": "nine", "pitch": "+2Hz", "rate": "+24%"},
    {"key": "ten", "text": "ten", "pitch": "+2Hz", "rate": "+24%"},
    {"key": "eleven", "text": "eleven", "pitch": "+0Hz", "rate": "+28%"},
    {"key": "twelve", "text": "twelve", "pitch": "+0Hz", "rate": "+28%"},
    {"key": "thirteen", "text": "thirteen", "pitch": "-2Hz", "rate": "+30%"},
    {"key": "and", "text": "and", "pitch": "-18Hz", "rate": "+82%"},
    {"key": "e", "text": "ee", "pitch": "-20Hz", "rate": "+96%"},
    # Keep token key "a", but synthesize "uh" to approximate pinyin "e".
    {"key": "a", "text": "uh", "pitch": "-18Hz", "rate": "+88%"},
]

PHRASE_CLIPS = [
    ("q", "{n}."),
    ("e", "{n} and."),
    ("s", "{n} e and uh."),
]

COUNT_WORDS = [
    "one",
    "two",
    "three",
    "four",
    "five",
    "six",
    "seven",
    "eight",
    "nine",
    "ten",
    "eleven",
    "twelve",
    "thirteen",
]

PHRASE_VARIANTS = {
    "slow": {
        "q": {"rate": "-8%", "pitch": "+0Hz"},
        "e": {"rate": "+14%", "pitch": "-4Hz"},
        "s": {"rate": "+34%", "pitch": "-10Hz"},
    },
    "mid": {
        "q": {"rate": "+18%", "pitch": "+0Hz"},
        "e": {"rate": "+56%", "pitch": "-8Hz"},
        "s": {"rate": "+92%", "pitch": "-14Hz"},
    },
    "fast": {
        "q": {"rate": "+34%", "pitch": "+0Hz"},
        "e": {"rate": "+82%", "pitch": "-10Hz"},
        "s": {"rate": "+118%", "pitch": "-16Hz"},
    },
}


async def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    PHRASE_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    for clip in CLIPS:
        key = clip["key"]
        text = clip["text"]
        rate = clip.get("rate", RATE)
        pitch = clip.get("pitch", "+0Hz")
        output_path = OUTPUT_DIR / f"{key}.mp3"
        communicate = edge_tts.Communicate(text, VOICE, rate=rate, pitch=pitch)
        await communicate.save(str(output_path))

    for variant_name, mode_options in PHRASE_VARIANTS.items():
        variant_output_dir = PHRASE_OUTPUT_DIR / variant_name
        variant_output_dir.mkdir(parents=True, exist_ok=True)

        for number_word in COUNT_WORDS:
            for prefix, template in PHRASE_CLIPS:
                text = template.format(n=number_word)
                pitch = mode_options[prefix]["pitch"]
                rate = mode_options[prefix]["rate"]

                output_path = variant_output_dir / f"{prefix}-{number_word}.mp3"
                communicate = edge_tts.Communicate(
                    text,
                    VOICE,
                    rate=rate,
                    pitch=pitch,
                )
                await communicate.save(str(output_path))

    phrase_total = len(PHRASE_CLIPS) * len(COUNT_WORDS) * len(PHRASE_VARIANTS)
    print(
        f"Generated {len(CLIPS)} single clips in {OUTPUT_DIR} and {phrase_total} phrase clips in {PHRASE_OUTPUT_DIR}",
    )


if __name__ == "__main__":
    if sys.platform.startswith("win"):
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(main())
