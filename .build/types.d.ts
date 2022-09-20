export declare type IAnyObject = Record<string, any>;
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
    intervalTime?: number;
    pollIsOn?: boolean;
    maxNum?: number;
    eventKey?: string;
    onReportSuccess?(events: IEvent[], rest: IReportCallbackRestOptions): void;
    onReportFail?(err: Error, events: IEvent[], rest: IReportCallbackRestOptions): void;
    onReportBefore?(url: string, data: IRequestData, isImmediate: boolean): void | false | IRequestData;
    backup?: {
        url: string;
        filter?: (event: IEvent[]) => boolean;
    };
    [k: string]: any;
}
export declare type IReportEventData = Record<string, IEvent>;
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
