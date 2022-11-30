import { IReportConfig } from './types';
import { getDefaultAdapter } from './adapter/index';

export const defaultConfig: IReportConfig = {
  isOn: false,
  intervalTime: 3000,
  pollIsOn: true, // 默认开启轮询合并上报
  maxNum: 4,
  eventsKey: 'events',
  eventUUIDKey: 'uuid',
  requestTimeout: 16000, // 16s 超时失败
  adapter: getDefaultAdapter(),
};
