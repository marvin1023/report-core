export type IAnyObject = Record<string, any>;

export interface IEvent {
  [k: string]: any;
}

export interface IReportCallbackRestOptions {
  requestStartTime: number;
  url: string;
  isImmediate: boolean;
}

export interface IReportCoreOptions {
  url: string;
  intervalTime?: number; // 合并上报的间隔时间
  pollIsOn?: boolean; // 合并上报轮询开启状态
  maxNum?: number; // 一次上报最多包括几条数据
  eventKey?: string; // 事件的 key，默认会自动使用 UUID 生成一个
  onReportSuccess?(events: IEvent[], rest: IReportCallbackRestOptions): void;
  onReportFail?(err: Error, events: IEvent[], rest: IReportCallbackRestOptions): void;
  onReportBefore?(url: string, data: IRequestData, isImmediate: boolean): void | false | IRequestData;
  backup?: {
    url: string;
    filter?: (event: IEvent[]) => boolean;
  };
  [k: string]: any;
}

export type IReportEventData = Record<string, IEvent>;

export interface IRequestData {
  events: IEvent[];
  [k: string]: any;
}

export interface IAdapterOptions {
  url: string;
  data: IRequestData;
  onReportSuccess(): void;
  onReportFail(err: Error): void;
}
