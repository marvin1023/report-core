declare type IAnyObject = Record<string, any>;
interface IEvent {
    [k: string]: any;
}
interface IReportCallbackRestOptions {
    requestStartTime: number;
    url: string;
    isImmediate: boolean;
}
interface IReportCoreOptions {
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
declare type IReportEventData = Record<string, IEvent>;
interface IRequestData {
    events: IEvent[];
    [k: string]: any;
}
interface IAdapterOptions {
    url: string;
    data: IRequestData;
    onReportSuccess(): void;
    onReportFail(err: Error): void;
}

declare class ReportCore {
    options: IReportCoreOptions;
    baseData: IAnyObject;
    timer?: ReturnType<typeof setTimeout>;
    unreportEventData: IReportEventData;
    reportingEventData: IReportEventData;
    initChild?(options: IAnyObject): void;
    constructor(options: IReportCoreOptions);
    init(options: IReportCoreOptions): void;
    updateBaseData(data: IAnyObject): void;
    pollRun(): void;
    pollStop(): void;
    send(events?: IEvent[], isImmediate?: boolean): void;
    doSend(events: IEvent[], isImmediate?: boolean): void;
    dispatch(url: string, data: IRequestData, isImmediate?: boolean): void;
    report(event: IEvent | IEvent[], isImmediate?: boolean): void;
    reportAll(): void;
    generateUUID(): string;
    getEvents(): IEvent[];
    concatEvents(newEvents: IEvent[]): void;
    getUnreportEventData(): IReportEventData;
    setUnreportEventData(data: IAnyObject): void;
    cleanEvents(events: IEvent[], type?: 0 | 1): void;
}

export { IAdapterOptions, IAnyObject, IEvent, IReportCallbackRestOptions, IReportCoreOptions, IReportEventData, IRequestData, ReportCore as default };
