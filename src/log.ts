/**
 * TODO：
 * 1. 对多种类型占位符支持
 */

import { getColors } from "./color";
import type { ColorItemMap } from "./color";

type FormatKey = ((key: string) => string) | undefined;

interface LogConfig {
  colorList: ColorItemMap[];
  // 自定义 key 前缀
  prefix?: string;
  // 自定义 key 后缀
  suffix?: string;
  // 是否展示时间
  isShowTime?: boolean;
  // 是否展示默认前缀和后缀
  isShowDefaultFix?: boolean;
  // 是否展示输出信息的类型
  isShowType?: boolean;
  // 自定义输出格式
  formatKey?: FormatKey;
}

interface KeyMapValue {
  color: ColorItemMap;
}

// 默认 key 前缀
const defaultPrefix = "==== ";
// 默认 key 后缀
const defaultSuffix = " ====";

const defaultConfig: LogConfig = {
  // 默认 key 前缀
  prefix: "",
  // 默认 key 后缀
  suffix: "",
  isShowTime: true,
  isShowDefaultFix: true,
  isShowType: true,
  colorList: [],
};

// const defaultConfig: LogConfig = {
//   colorList: [
//     // white
//     // "#ffffff",
//     // red
//     "#ffa39e",
//     "#f5222d",
//     // Volcano
//     "#ffd8bf",
//     "#ff7a45",
//     // orange
//     "#ffe7ba",
//     "#fa8c16",
//     // Gold
//     "#fff1b8",
//     "#ffc53d",
//     // yellow
//     "#fffb8f",
//     "#ffec3d",
//     // lime
//     "#eaff8f",
//     "#bae637",
//     "#a0d911",
//     // green
//     "#b7eb8f",
//     "#52c41a",
//     // Cyan
//     "#b5f5ec",
//     "#13c2c2",
//     // blue
//     "#91caff",
//     "#1677ff",
//     // geekblue
//     "#1d39c4",
//     // purple
//     "#b37feb",
//     "#722ed1",
//     // magenta
//     "#ffd6e7",
//     "#eb2f96",
//     // black
//     "#000000",
//   ],
// };

interface LogCfgObject {
  color?: string;
  key?: string;
}

type LogCfg = LogCfgObject | string;

// 判断参数类型
function typeOfParams(param: unknown): string {
  return Object.prototype.toString.call(param).slice(8, -1).toLowerCase();
}

function getStyle(color: string, textColor: string) {
  const theme = getDevtoolThemeColor();
  const valueColor = theme === "dark" ? "#fff" : "#000";
  return [
    `background:${color};border:1px solid ${color}; padding: 1px; border-radius: 2px 0 0 2px; color: ${textColor};`,
    `border:1px solid ${color}; padding: 1px; border-radius: 0 2px 2px 0; color: ${valueColor};`,
    "background:transparent"
  ]
}

function getKey(key: string, prefix: string, suffix: string, formatKey: FormatKey) {
  let _key = key;
  if (typeof formatKey === 'function') {
    _key = formatKey(key);
  }

  return `${prefix || ''}${_key}${suffix || ''}`;
}

function pad2(num: number)  {
  return num.toString().padStart(2, '0');
}

function getDevtoolThemeColor() {
  const isDark = window.matchMedia?.('(prefers-color-scheme: dark)')?.matches;
  const isLight = window.matchMedia?.('(prefers-color-scheme: light)')?.matches;

  return isDark ? 'dark' : 'light'
}

function getCurrTime() {
  const date = new Date();
  const hour = pad2(date.getHours());
  const minute = pad2(date.getMinutes());
  const second = pad2(date.getSeconds());

  return `${hour}:${(minute)}:${second}`;
}

export default class Log {
  config: LogConfig;

  static keyMap: Record<string, KeyMapValue> = {};

  static colorList: ColorItemMap[] = [];

  constructor(config?: LogConfig) {
    this.config = Object.assign(defaultConfig, config || {});
    if (Log.colorList.length === 0) {
      Log.colorList = getColors([1, 5, 7]);
    }
  }

  private removeColor(color: string) {
    Log.colorList = Log.colorList.filter((c) => c.color !== color);
  }

  private generateLableFix(key: string) {
    const { prefix, suffix, isShowDefaultFix, formatKey } = this.config;
    const _prefix = prefix ? prefix : isShowDefaultFix ? defaultPrefix : '';
    const _affix = suffix ? suffix : isShowDefaultFix ? defaultSuffix : '';
    
    const _key = getKey(key, _prefix || '', _affix || '', formatKey);

    return _key;
  }

  private generateLabel(key: string, type: string)  {
    // 完整输出示例：`${getCurrTime()}  %c ${_key} (type:${type})  %c`,
    const { isShowTime, isShowType } = this.config;

    let label = this.generateLableFix(key);

    label = `%c ${label}`;

    if (isShowTime) {
      label = ` ${getCurrTime()} ${label}`;
    }

    if (isShowType)  {
      label = ` ${label} (type:${type})`;
    }

    return label;
  }

  private _log(key: string, message: unknown, color: ColorItemMap) {
    const styleList = getStyle(color.color, color.textColor);
    const type = typeOfParams(message);
    let label = this.generateLabel(key, type);

    label = type === "object" || type === "array" ? label : `${label} %c ${message} `;
    
    const labelPlaceholderCount = label.split('%c').length - 1;
    const style = styleList.slice(0, labelPlaceholderCount)

    if (type === "object" || type === "array")  {
      console.group(this.generateLableFix(key));
      console.log(label, ...style)
      console.log(message);
      console.groupEnd();
    } else {
      console.log(
        label,
        ...style
      );
    }
  }

  private baseLog(key: string, message: unknown[], color?: string) {
    let _color = {
      color: color || "",
      textColor: "#ffffff",
    };

    if (!color) {
      if (!Log.keyMap[key]) {
        // 随机选择颜色逻辑
        // const colorIndex = Math.floor(
        //   Math.random() * this.config.colorList.length
        // );
        // _color = this.config.colorList[colorIndex];

        if (Log.colorList.length === 0) {
          Log.colorList = getColors([2, 3, 6]);
        }
        // 顺序选择颜色逻辑
        _color = Log.colorList.shift() as ColorItemMap;
        this.removeColor(_color.color);
        Log.keyMap[key] = {
          color: _color,
        };
      } else {
        _color = Log.keyMap[key].color;
      }
    }

    // 多个参数时，输出到控制台分组
    if (message.length > 1) {
      console.group(this.generateLableFix(key));
      for (let i = 0; i < message.length; i++) {
        this._log(key, message[i], _color);
      }
      console.groupEnd();
      
      return;
    }

    this._log(key, message[0], _color);
  }

  public setConfig(config: LogConfig) {
    this.config = Object.assign(config, defaultConfig);
  }

  // 获取配置信息
  public getConfig() {
    return this.config;
  }

  // 打印信息
  public log = (logCfg: LogCfg, ...message: unknown[]) => {
    let color = "";
    let key = "";
    if (typeOfParams(logCfg) === "string") {
      key = logCfg as string;
    } else if (typeOfParams(logCfg) === "object") {
      key = (logCfg as LogCfgObject).key || "";
      color = (logCfg as LogCfgObject).color || "";
    }
    this.baseLog(key, message, color);
  };
}

const logInstance = new Log();

export const log = logInstance.log;
