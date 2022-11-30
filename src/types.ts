export type IAnyObject = Record<string, any>;

export interface IReportEvent {
  uuid?: string;
  [k: string]: any;
}

export interface ReportRequestData {
  events?: IReportEvent[];
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
export type ReportSuccessCallback = (events: IReportEvent[], rest: ReportCallbackRestOptions) => void;
export type ReportFailCallback = (err: Error, events: IReportEvent[], rest: ReportCallbackRestOptions) => void;
export interface ReportBackupOptions {
  url: string;
  filter?: (events: IReportEvent[]) => boolean;
}

export interface IReportConfig {
  isOn: boolean; // 上报是否开启，如果没有开启，则所有的合并上报都不会上报
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
export interface IReportInitOptions extends Partial<IReportConfig> {
  url: string;
}

export interface IReportInstanceOptions extends IReportConfig {
  url: string;
}

export type IReportEventData = Record<string, IReportEvent>;

export interface ReportAdapterOptions {
  url: string;
  data: ReportRequestData;
  timeout?: number;
  onReportSuccess?(): void;
  onReportFail?(err: Error): void;
}

export interface IReportRequestOptions {
  events: IReportEvent[];
  url?: string;
  isImmediate?: boolean;
}
