export type SoundPackId =
  | "studio-click"
  | "wood-block"
  | "analog-pulse"
  | "shaker-tick"
  | "count-one-e-and-e";

export type SoundPackOption = {
  id: SoundPackId;
  label: string;
  subtitle: string;
  previewLine: string;
};

export const soundPackOptions: SoundPackOption[] = [
  {
    id: "studio-click",
    label: "录音室点击音",
    subtitle: "清晰干净的数字点击音，重音分明",
    previewLine: "滴 哒 滴 哒",
  },
  {
    id: "wood-block",
    label: "木鱼块音",
    subtitle: "温暖的木质打击感，适合日常练习",
    previewLine: "咚 嗒 嗒 嗒",
  },
  {
    id: "analog-pulse",
    label: "模拟脉冲",
    subtitle: "圆润的合成器脉冲音，尾音柔和",
    previewLine: "砰 啪 啪 啪",
  },
  {
    id: "shaker-tick",
    label: "沙锤轻击",
    subtitle: "明亮轻盈的高频颗粒感点击音",
    previewLine: "嘶 嘶 嘶 嘶",
  },
  {
    id: "count-one-e-and-e",
    label: "人声数拍：一 e 与 e",
    subtitle: "适用于“一 e 与 e，二 e 与 e...”的重音流动",
    previewLine: "一 e 与 e 二 e 与 e 三 e 与 e 四 e 与 e",
  },
];
