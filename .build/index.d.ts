import { IReportCoreOptions, IAnyObject, IReportEventData, IEvent, IRequestData } from './types';
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
export default ReportCore;
