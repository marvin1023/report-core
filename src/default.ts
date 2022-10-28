import { ReportInstanceOptions } from './types';
import { getDefaultAdapter } from './adapter/index';

export const defaultOptions: Omit<ReportInstanceOptions, 'url'> = {
  maxNum: 4,
  intervalTime: 3000,
  eventUUIDKey: 'uuid',
  eventsKey: 'events',
  pollIsOn: true, // 默认开启轮询合并上报
  requestTimeout: 20000, // 20s 超时失败
  adapter: getDefaultAdapter(),
};
