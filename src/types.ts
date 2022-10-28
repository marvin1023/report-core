export type IAnyObject = Record<string, any>;

export interface ReportEvent {
  uuid?: string;
  [k: string]: any;
}

export interface ReportRequestData {
  events?: ReportEvent[];
  [k: string]: any;
}

export interface ReportCallbackRestOptions {
  requestStartTime: number;
  url: string;
  isImmediate: boolean;
}

export type ReportBeforeCallback = (
  url: string,
  data: ReportRequestData,
  isImmediate: boolean,
) => void | false | ReportRequestData;
export type ReportSuccessCallback = (events: ReportEvent[], rest: ReportCallbackRestOptions) => void;
export type ReportFailCallback = (err: Error, events: ReportEvent[], rest: ReportCallbackRestOptions) => void;
export interface ReportBackupOptions {
  url: string;
  filter?: (events: ReportEvent[]) => boolean;
}

export interface ReportInstanceOptions {
  url: string;
  intervalTime: number; // 合并上报的间隔时间
  pollIsOn: boolean; // 合并上报轮询开启状态
  maxNum: number; // 一次上报最多包括几条数据
  eventsKey: string; // events 的键值
  eventUUIDKey: string; // 事件的 key，默认会自动使用 UUID 生成一个
  requestTimeout: number; // 请求超时
  onReportSuccess?: ReportSuccessCallback;
  onReportFail?: ReportFailCallback;
  onReportBefore?: ReportBeforeCallback;
  backup?: ReportBackupOptions;
  [k: string]: any;
}
export interface ReportOptions extends Partial<ReportInstanceOptions> {
  url: string;
}

export type ReportEventData = Record<string, ReportEvent>;

export interface ReportAdapterOptions {
  url: string;
  data: ReportRequestData;
  timeout?: number;
  onReportSuccess?(): void;
  onReportFail?(err: Error): void;
}

export interface ReportRequestOptions {
  events: ReportEvent[];
  url?: string;
  isImmediate?: boolean;
}
