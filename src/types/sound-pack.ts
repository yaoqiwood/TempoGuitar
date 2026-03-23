export type SoundPackId =
  | "studio-click"
  | "wood-block"
  | "analog-pulse"
  | "shaker-tick";

export type SoundPackOption = {
  id: SoundPackId;
  label: string;
  subtitle: string;
  previewLine: string;
};

export const soundPackOptions: SoundPackOption[] = [
  {
    id: "studio-click",
    label: "录音室点击",
    subtitle: "清晰干净的数字点击音，重拍更明确。",
    previewLine: "哒 嗒 哒 嗒",
  },
  {
    id: "wood-block",
    label: "木鱼块音",
    subtitle: "温暖的木质打击感，适合日常练习。",
    previewLine: "咔 哒 哒 哒",
  },
  {
    id: "analog-pulse",
    label: "模拟脉冲",
    subtitle: "圆润的合成器脉冲音色，尾音更柔和。",
    previewLine: "啪 嘀 嘀 嘀",
  },
  {
    id: "shaker-tick",
    label: "沙锤轻击",
    subtitle: "明亮轻盈的高频颗粒感点击音。",
    previewLine: "嘶 嘶 嘶 嘶",
  },
];
