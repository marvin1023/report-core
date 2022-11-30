import {
  IReportInitOptions,
  IReportInstanceOptions,
  IReportConfig,
  IAnyObject,
  IReportEventData,
  IReportEvent,
  IReportRequestOptions,
} from './types';
import { defaultConfig } from './default';

export class Report {
  static config: IReportConfig = { ...defaultConfig };

  static setConfig = (config: IReportConfig) => {
    Object.assign(Report.config, config);
  };

  options!: IReportInstanceOptions;
  baseData!: IAnyObject; // 基础数据
  timer?: ReturnType<typeof setTimeout>;
  unreportEventData: IReportEventData = {}; // 待上报的数据对象
  reportingEventData: IReportEventData = {}; // 正在上报中的数据对象

  constructor(options: IReportInitOptions) {
    this.init(options);
  }

  init(options: IReportInitOptions) {
    // 初始化参数
    this.initOptions(options);

    // 初始化基础数据
    this.initBaseData();

    // 自动轮询上报
    if (this.options.pollIsOn) {
      this.pollRun();
    }
  }

  initOptions(options: IReportInitOptions) {
    this.options = Object.assign({}, Report.config, options);
  }

  initBaseData() {
    this.baseData = {};
  }

  // 更新 baseData
  updateBaseData(data: IAnyObject) {
    Object.assign(this.baseData, data);
  }

  pollRun() {
    const { intervalTime } = this.options;
    this.timer = setTimeout(() => {
      if (Report.config.isOn) {
        this.dispatch();
      }
      this.pollRun();
    }, intervalTime);
  }

  pollStop(isStopAndReport?: false) {
    if (this.timer) {
      clearTimeout(this.timer);
    }

    // 把剩余的都上报下
    if (isStopAndReport) {
      this.reportAll();
    }
  }

  dispatch(events: IReportEvent[] = this.getEvents(), isImmediate = false) {
    const { length } = events;
    if (length === 0) {
      return;
    }

    const maxNum = this.options.maxNum;

    if (length <= maxNum) {
      this.callRequest(events, isImmediate);
      return;
    }

    // 大于最大数，则分割上报
    const repeatNum = Math.ceil(length / maxNum);
    for (let i = 0; i < repeatNum; i++) {
      const realEvents = events.slice(i * maxNum, (i + 1) * maxNum);
      this.callRequest(realEvents, isImmediate);
    }
  }

  callRequest(events: IReportEvent[], isImmediate: boolean) {
    const { backup } = this.options;

    this.request({ events, isImmediate });

    // 如果有备用的，则备用也发送一份，用以校验数据
    if (backup && (!backup.filter || backup.filter(events))) {
      this.request({ url: backup.url, events, isImmediate });
    }
  }

  request(data: IReportRequestOptions) {
    const { adapter, onReportSuccess, onReportFail, onReportBefore, eventsKey } = this.options;
    let { url = this.options.url, isImmediate = false } = data;
    const { events } = data;

    if (!url) {
      throw new Error('report url is required');
    }

    let reportData = {
      ...this.baseData,
      [eventsKey]: events,
    };

    // onReportBefore 回调可以进行拦截及修改最后的数据
    const beforeReportReturn = onReportBefore?.(url, reportData, isImmediate);

    if (beforeReportReturn === false) {
      return;
    }

    if (beforeReportReturn && beforeReportReturn.constructor === Object) {
      url = beforeReportReturn.url ?? url;
      reportData = beforeReportReturn.data ?? reportData;
      isImmediate = beforeReportReturn.isImmediate ?? isImmediate;
    }

    // 记录请求发起时间
    const requestStartTime = Date.now();

    adapter({
      url,
      data: reportData,
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

  report<T extends IReportEvent>(event: T | T[], isImmediate = false) {
    const newEvent: T[] = Array.isArray(event) ? event : [event];
    const { eventUUIDKey } = this.options;

    newEvent.forEach((item) => {
      if (!item[eventUUIDKey]) {
        // @ts-ignore
        item[eventUUIDKey] = this.generateUUID();
      }
    });

    if (isImmediate) {
      this.dispatch(newEvent, true);
    } else {
      this.concatEvents(newEvent);
    }
  }

  // 页面离开时，将待上报数据统一上报
  reportAll() {
    this.dispatch();
  }

  generateUUID(bytes = 16) {
    const SHARED_CHAR_CODES_ARRAY = Array(32);
    for (let i = 0; i < bytes * 2; i++) {
      SHARED_CHAR_CODES_ARRAY[i] = Math.floor(Math.random() * 16) + 48;
      // valid hex characters in the range 48-57 and 97-102
      if (SHARED_CHAR_CODES_ARRAY[i] >= 58) {
        SHARED_CHAR_CODES_ARRAY[i] += 39;
      }
    }
    return String.fromCharCode.apply(null, SHARED_CHAR_CODES_ARRAY.slice(0, bytes * 2));
  }

  getEvents() {
    // 从待上报数据中过滤出来上报中的数据，并返回该数组
    // 同时将待上报的数据加入上报中
    const res: IReportEvent[] = [];
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

  concatEvents(newEvents: IReportEvent[]) {
    if (!newEvents || newEvents.length === 0) {
      return;
    }
    const eventData = this.getUnreportEventData();
    for (const event of newEvents) {
      const eventId = event[this.options.eventUUIDKey];
      eventData[eventId] = event;
    }
    this.setUnreportEventData(eventData);

    // 如果没有开启，则不会上报
    if (Report.config.isOn) {
      return;
    }

    // 如果大于最大数，则直接调用上报，不用再等 setTimeout 的触发
    if (Object.keys(eventData).length - Object.keys(this.reportingEventData).length >= this.options.maxNum) {
      this.dispatch();
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
  cleanEvents(events: IReportEvent[], type: 0 | 1 = 0) {
    // type 为 0 表示只清除上报中的数据，用于上报失败的时候
    // 为 1 表示清除待上报及上报中的数据，用于上报成功的时候

    const unreportEventData = type === 0 ? {} : this.getUnreportEventData();
    const { reportingEventData } = this;

    events.forEach((item) => {
      const key = item[this.options.eventUUIDKey] as string;
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
