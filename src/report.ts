import { IReportCoreOptions, IAnyObject, IReportEventData, IEvent, IRequestData } from './types';
import getDefaultAdapter from './adapter/index';

class ReportCore {
  options!: IReportCoreOptions;
  baseData: IAnyObject = {}; // 基础数据
  timer?: ReturnType<typeof setTimeout>;
  unreportEventData: IReportEventData = {}; // 待上报的数据对象
  reportingEventData: IReportEventData = {}; // 正在上报中的数据对象
  initChild?(options: IAnyObject): void; // 子类初始化函数

  constructor(options: IReportCoreOptions) {
    this.init(options);
  }

  init(options: IReportCoreOptions) {
    const defaultOptions: Omit<IReportCoreOptions, 'url'> = {
      maxNum: 4,
      intervalTime: 3000,
      eventKey: 'uuid',
      pollIsOn: true, // 默认开启轮询合并上报
      adapter: getDefaultAdapter(),
    };

    this.options = Object.assign(defaultOptions, options);

    if (!this.options.url) {
      console.error('url is required.');
      return;
    }

    if (this.initChild) {
      this.initChild(options);
    }

    if (this.options.pollIsOn) {
      this.pollRun();
    }
  }

  // 更新 baseData
  updateBaseData(data: IAnyObject) {
    Object.assign(this.baseData, data);
  }

  pollRun() {
    const { intervalTime } = this.options;
    this.timer = setTimeout(() => {
      this.send();
      this.pollRun();
    }, intervalTime);
  }

  pollStop() {
    if (this.timer) {
      clearTimeout(this.timer);
    }
  }

  send(events: IEvent[] = this.getEvents(), isImmediate = false) {
    const { length } = events;
    if (length === 0) {
      return;
    }

    const maxNum = this.options.maxNum!;

    if (length <= maxNum) {
      this.doSend(events, isImmediate);
      return;
    }

    // 大于最大数，则分割上报
    const repeatNum = Math.ceil(length / maxNum);
    for (let i = 0; i < repeatNum; i++) {
      const realEvents = events.slice(i * maxNum, (i + 1) * maxNum);
      this.doSend(realEvents, isImmediate);
    }
  }

  doSend(events: IEvent[], isImmediate?: boolean) {
    const data = {
      ...this.baseData,
      events,
    };

    const { url, backup } = this.options;

    this.dispatch(url, data, isImmediate);

    // 如果有备用的，则备用也发送一份，用以校验数据
    if (backup && (!backup.filter || backup.filter(events))) {
      this.dispatch(backup.url, data, isImmediate);
    }
  }

  dispatch(url: string, data: IRequestData, isImmediate = false) {
    const { adapter, onReportSuccess, onReportFail, onReportBefore } = this.options;
    const { events } = data;

    if (!url) {
      throw new Error('please call init before');
    }

    // onReportBefore 回调可以进行拦截及修改最后的数据
    const beforeReportReturn = onReportBefore?.(url, data, isImmediate);

    if (beforeReportReturn === false) {
      return;
    }

    if (beforeReportReturn && beforeReportReturn.constructor === Object) {
      url = beforeReportReturn.url ?? url;
      data = beforeReportReturn.data ?? data;
      isImmediate = beforeReportReturn.isImmediate ?? isImmediate;
    }

    // 记录请求发起时间
    const requestStartTime = Date.now();

    adapter({
      url,
      data,
      onReportSuccess: () => {
        onReportSuccess?.(events, { requestStartTime, url, isImmediate });
        // 立即上报没有待上报对象和上报中对象，所以不用处理
        if (isImmediate) {
          return;
        }
        this.cleanEvents(events, 1);
      },
      onReportFail: (err: Error) => {
        onReportFail?.(err, events, { requestStartTime, url, isImmediate });
        // 立即上报失败存储到待上报对象中
        if (isImmediate) {
          this.concatEvents(events);
        } else {
          this.cleanEvents(events, 0);
        }
      },
    });
  }

  report(event: IEvent | IEvent[], isImmediate = false) {
    const newEvent: IEvent[] = Array.isArray(event) ? event : [event];

    newEvent.forEach((item) => {
      if (!item[this.options.eventKey!]) {
        item.uuid = this.generateUUID();
      }
    });

    if (isImmediate) {
      this.send(newEvent, true);
    } else {
      this.concatEvents(newEvent);
    }
  }

  // 页面离开时，将待上报数据统一上报
  reportAll() {
    this.send();
  }

  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c == 'x' ? r : (r & 0x3) | 0x8;

      return v.toString(16);
    });
  }

  getEvents() {
    // 从待上报数据中过滤出来上报中的数据，并返回该数组
    // 同时将待上报的数据加入上报中
    const res: IEvent[] = [];
    // 通过方法获取待上报数据，原因见该方法的注释
    const unreportEventData = this.getUnreportEventData();
    // 通过属性获取上报中数据
    const { reportingEventData } = this;

    Object.keys(unreportEventData).forEach((item) => {
      if (!reportingEventData[item]) {
        const eventData = unreportEventData[item];
        // 得到要上报的数据
        res.push(eventData);
        // 把数据变成上报中数据
        reportingEventData[item] = eventData;
      }
    });

    return res;
  }

  concatEvents(newEvents: IEvent[]) {
    if (!newEvents || newEvents.length === 0) {
      return;
    }
    const eventData = this.getUnreportEventData();
    for (const event of newEvents) {
      const eventId = event[this.options.eventKey!] as string;
      eventData[eventId] = event;
    }
    this.setUnreportEventData(eventData);

    // 如果大于最大数，则直接调用上报，不用再等 setTimeout 的触发
    if (Object.keys(eventData).length - Object.keys(this.reportingEventData).length >= this.options.maxNum!) {
      this.send();
    }
  }

  // 默认待上报的数据，我们存在属性上，用户可以通过覆写 get 和 update 方法存到 storage 中
  getUnreportEventData() {
    return this.unreportEventData;
  }

  setUnreportEventData(data: IAnyObject) {
    this.unreportEventData = data;
  }

  // 根据上报的成功或失败，删除待上报或上报中的数据
  cleanEvents(events: IEvent[], type: 0 | 1 = 0) {
    // type 为 0 表示只清除上报中的数据，用于上报失败的时候
    // 为 1 表示清除待上报及上报中的数据，用于上报成功的时候

    const unreportEventData = type === 0 ? {} : this.getUnreportEventData();
    const { reportingEventData } = this;

    events.forEach((item) => {
      const key = item[this.options.eventKey!] as string;
      if (reportingEventData[key]) {
        delete reportingEventData[key];
      }

      if (type === 1 && unreportEventData[key]) {
        delete unreportEventData[key];
      }
    });

    // 删除数据后更新
    if (type === 1) {
      this.setUnreportEventData(unreportEventData);
    }
  }
}

export default ReportCore;
