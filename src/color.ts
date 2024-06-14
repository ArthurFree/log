import { inputToRGB, rgbToHsv } from "@ctrl/tinycolor";

export const PresetColors = [
  "blue",
  "purple",
  "cyan",
  "green",
  "magenta",
  "pink",
  "red",
  "orange",
  "yellow",
  "volcano",
  "geekblue",
  "lime",
  "gold",
] as const;

interface HsvObject {
  h: number;
  s: number;
  v: number;
}

interface RgbObject {
  r: number;
  g: number;
  b: number;
}

// 色相阶梯
const hueStep = 2;
// 饱和度阶梯，浅色部分
const saturationStep = 0.16;
// 饱和度阶梯，深色部分
const saturationStep2 = 0.05;
// 亮度阶梯，浅色部分
const brightnessStep1 = 0.05;
// 亮度阶梯，深色部分
const brightnessStep2 = 0.15;
// 浅色数量，主色上
const lightColorCount = 5;
// 深色数量，主色下
const darkColorCount = 4;

// 暗色主题颜色映射关系表
const darkColorMap = [
  { index: 7, opacity: 0.15 },
  { index: 6, opacity: 0.25 },
  { index: 5, opacity: 0.3 },
  { index: 5, opacity: 0.45 },
  { index: 5, opacity: 0.65 },
  { index: 5, opacity: 0.85 },
  { index: 4, opacity: 0.9 },
  { index: 3, opacity: 0.95 },
  { index: 2, opacity: 0.97 },
  { index: 1, opacity: 0.98 },
];

// 基础色
const defaultPresetColors: Record<string, string> = {
  blue: "#1677ff",
  purple: "#722ED1",
  cyan: "#13C2C2",
  green: "#52C41A",
  magenta: "#EB2F96",
  pink: "#eb2f96",
  red: "#F5222D",
  orange: "#FA8C16",
  yellow: "#FADB14",
  volcano: "#FA541C",
  geekblue: "#2F54EB",
  gold: "#FAAD14",
  lime: "#A0D911",
};

function pad2(c: string): string {
  return c.length === 1 ? `0${c}` : String(c);
}

function rgbToHex(
  r: number,
  g: number,
  b: number,
  allow3Char: boolean
): string {
  const hex = [
    pad2(Math.round(r).toString(16)),
    pad2(Math.round(g).toString(16)),
    pad2(Math.round(b).toString(16)),
  ];

  // Return a 3 character hex if possible
  if (
    allow3Char &&
    hex[0].startsWith(hex[0].charAt(1)) &&
    hex[1].startsWith(hex[1].charAt(1)) &&
    hex[2].startsWith(hex[2].charAt(1))
  ) {
    return hex[0].charAt(0) + hex[1].charAt(0) + hex[2].charAt(0);
  }

  return hex.join("");
}

// Wrapper function ported from TinyColor.prototype.toHsv
// Keep it here because of `hsv.h * 360`
function toHsv({ r, g, b }: RgbObject): HsvObject {
  const hsv = rgbToHsv(r, g, b);
  return { h: hsv.h * 360, s: hsv.s, v: hsv.v };
}

// Wrapper function ported from TinyColor.prototype.toHexString
// Keep it here because of the prefix `#`
function toHex({ r, g, b }: RgbObject): string {
  return `#${rgbToHex(r, g, b, false)}`;
}

// Wrapper function ported from TinyColor.prototype.mix, not treeshakable.
// Amount in range [0, 1]
// Assume color1 & color2 has no alpha, since the following src code did so.
function mix(rgb1: RgbObject, rgb2: RgbObject, amount: number): RgbObject {
  const p = amount / 100;
  const rgb = {
    r: (rgb2.r - rgb1.r) * p + rgb1.r,
    g: (rgb2.g - rgb1.g) * p + rgb1.g,
    b: (rgb2.b - rgb1.b) * p + rgb1.b,
  };
  return rgb;
}

// 色调计算
function getHue(hsv: HsvObject, i: number, light?: boolean): number {
  let hue: number;
  // 根据色相不同，色相转向不同
  if (Math.round(hsv.h) >= 60 && Math.round(hsv.h) <= 240) {
    hue = light
      ? Math.round(hsv.h) - hueStep * i
      : Math.round(hsv.h) + hueStep * i;
  } else {
    hue = light
      ? Math.round(hsv.h) + hueStep * i
      : Math.round(hsv.h) - hueStep * i;
  }
  if (hue < 0) {
    hue += 360;
  } else if (hue >= 360) {
    hue -= 360;
  }
  return hue;
}

// 饱和度计算
function getSaturation(hsv: HsvObject, i: number, light?: boolean): number {
  // grey color don't change saturation
  if (hsv.h === 0 && hsv.s === 0) {
    return hsv.s;
  }
  let saturation: number;
  if (light) {
    saturation = hsv.s - saturationStep * i;
  } else if (i === darkColorCount) {
    saturation = hsv.s + saturationStep;
  } else {
    saturation = hsv.s + saturationStep2 * i;
  }
  // 边界值修正
  if (saturation > 1) {
    saturation = 1;
  }
  // 第一格的 s 限制在 0.06-0.1 之间
  if (light && i === lightColorCount && saturation > 0.1) {
    saturation = 0.1;
  }
  if (saturation < 0.06) {
    saturation = 0.06;
  }
  return Number(saturation.toFixed(2));
}

// 明度计算
function getValue(hsv: HsvObject, i: number, light?: boolean): number {
  let value: number;
  if (light) {
    value = hsv.v + brightnessStep1 * i;
  } else {
    value = hsv.v - brightnessStep2 * i;
  }
  if (value > 1) {
    value = 1;
  }
  return Number(value.toFixed(2));
}

interface Opts {
  theme?: "dark" | "default";
  backgroundColor?: string;
}

export function generate(color: string, opts: Opts = {}): string[] {
  const patterns: string[] = [];
  const pColor = inputToRGB(color);
  for (let i = lightColorCount; i > 0; i -= 1) {
    const hsv = toHsv(pColor);
    const colorString: string = toHex(
      inputToRGB({
        h: getHue(hsv, i, true),
        s: getSaturation(hsv, i, true),
        v: getValue(hsv, i, true),
      })
    );
    patterns.push(colorString);
  }
  patterns.push(toHex(pColor));
  for (let i = 1; i <= darkColorCount; i += 1) {
    const hsv = toHsv(pColor);
    const colorString: string = toHex(
      inputToRGB({
        h: getHue(hsv, i),
        s: getSaturation(hsv, i),
        v: getValue(hsv, i),
      })
    );
    patterns.push(colorString);
  }

  // dark theme patterns
  if (opts.theme === "dark") {
    return darkColorMap.map(({ index, opacity }) => {
      const darkColorString: string = toHex(
        mix(
          inputToRGB(opts.backgroundColor || "#141414"),
          inputToRGB(patterns[index]),
          opacity * 100
        )
      );
      return darkColorString;
    });
  }
  return patterns;
}

export type PalettesProps = Record<string, string[] & { primary?: string }>;
const presetPalettes: PalettesProps = {};
// const presetDarkPalettes: PalettesProps = {};

export function getPresetColors() {

  for (const key in defaultPresetColors) {
    presetPalettes[key] = generate(defaultPresetColors[key]);
    // presetPalettes[key].primary = presetPalettes[key][5];

    // dark presetPalettes
    // presetDarkPalettes[key] = generate(defaultPresetColors[key], {
    //   theme: "dark",
    //   backgroundColor: "#141414",
    // });
    // presetDarkPalettes[key].primary = presetDarkPalettes[key][5];
  }
}

export interface ColorItemMap {
  color: string;
  textColor: string;
}

export function getColors(indexArr: number[]) {
  let colorKeys = Object.keys(presetPalettes);

  if (colorKeys.length === 0)  {
    getPresetColors();
    colorKeys = Object.keys(presetPalettes);
  }

  let colorArr: ColorItemMap[] = [];
  for (const key of colorKeys)  {
    const colors = indexArr.map((ind: number) => {
      return {
        color: presetPalettes[key][ind],
        textColor: ind > 5 ? "#fff" : "#000",
      }
    });
    colorArr = colorArr.concat(colors);
  }

  console.table(colorArr)

  return colorArr;
}
