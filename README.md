# ReportCore

数据上报基础库。整体设计思想见最后的脑图。

## 功能

- 支持立即上报及合并上报两种；
- 支持合并上报轮询的开启及停止；
- 支持自定义合并上报的最大数据量，防止一次上报数据太大，导致可能失败；
- 支持上报拦截及修改；
- 支持最后将还未上报的数据，一次性全部发送；
- 支持将同一份数据上报到备份地址，为了查证上报的丢失率；
- 支持上报失败后，会自动将失败的数据压入待上报数据，等待下次合并上报的重新上报；
- 支持自定义发送请求适配器，默认自动判断使用 `wx.request` 还是 `XMLHttpRequest` 进行上报。

## 安装

```bash
npm i report-core --save
```

## 使用

1、 实例化

如果你的上报比较简单，可以直接通过实例化形式使用。反之，如果比较复杂，那就可以基于此类进行扩展实现更多功能，下面以实例化为例简单说明如何使用：

```js
// reporter.ts
// --------------------------------------
import { Report, ReportEvent } from 'report-core';

// 默认参数如下：
// {
//   maxNum: 4, // 一次上报最多包括几条数据，当未上报数据大于该值时，会自动触发上报，且上报时会以此为分割，防止一次上报数据过大造成失败
//   intervalTime: 3000, // setTimeout 执行上报的间隔时间
//   eventUUIDKey: 'uuid', // 每条上报数据的唯一 key，默认会自动生成 uuid 作为 key 值，如果指定该值，则以上报数据中该值为 key
//   eventsKey: 'events', // 数据数组字段，详见下面上报数据说明
//   pollIsOn: true, // 默认开启轮询合并上报
//   requestTimeout: 16000, // 16s 超时失败
//   adapter: getDefaultAdapter(), // 自动适配 WEB 还是小程序发送请求
// };

// 参数类型为：ReportOptions，见下面说明
const reporter = new Report({
  url: 'xxx',
});

// 更新基础数据
// 机型、版本，用户信息等
const baseData: Record<string, any> = {
  appId: 'xxx',
  appVersion: 'xxx',
  platform: 'xxx',
};

reporter.updateBaseData(baseData);

export default reporter;
```

2、调用

```js
import reporter from './reporter';

const fakeEvent1 = {
  eventTime: Date.now.toString(),
  type: 'click',
  value: 'xxx',
};

const fakeEvent2 = {
  eventTime: Date.now.toString(),
  type: 'view',
  value: 'xxx',
};

// 立即上报
reporter.report(fakeEvent1, true);

// 合并上报
reporter.report(fakeEvent1);

// 多条数据上报
reporter.report([fakeEvent1, fakeEvent2]);

// 用于最后页面离开等情况的，将未上报的数据进行上报
reporter.reportAll();
```

** ReportOptions 参数类型说明**

```ts
export interface ReportOptions extends Partial<ReportInstanceOptions> {
  url: string;
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
```

## 上报数据结构说明

### 一次请求发送的数据

首先一次请求只有一份基础数据（上面 `updateBaseData` 方法返回的 `baseData` ）和要具体上报的数据组（可以是单条，也可以是多条的合并上报数据）。

所以一次请求的数据结构如下：

```ts
// 数据组字段默认是 events，可以通过实例化时设置 eventsKey 进行自定义
export interface ReportRequestData {
  events?: ReportEventEvent[]; // 需要上报的数据数组，可能是1条，也可能是多条的合并
  [k: string]: any; // baseData 的各个数据，如机型，版本号等
}
```

### 一次 report 方法调用的数据

```ts
import { ReportEvent } from 'report-core';
import reporter from './reporter';

reporter.report(event: ReportEvent | ReportEvent[], isImmediate = false){}
```

`ReportEvent` 类型如下：

```ts
// 唯一 key 字段默认为 uuid，可以通过实例化时设置 eventUUIDKey 进行自定义
export interface ReportEvent {
  uuid?: string; // 默认每条数据的唯一 key
  [k: string]: any;
}
```

PS：如果 report 参数 `event` 不是数组，默认会自动转成数组 `[event]`，然后进行处理。

## 合并上报说明

### 合并上报触发条件

- 待上报数据超过 maxNum（默认为 4），执行上报。同时如果一次上报数据超过 maxNum，将进行切割上报。
- 轮询每隔 intervalTime（默认为 3s）， 执行上报。

### 合并上报涉及的数据

- 待上报数据对象（unreportEventData）：默认存储在 `this.unreportEventData` 属性中，支持自定义存储位置，如 storage，见下面例子。
- 上报中数据对象（reportingEventData）：合并上报中已发出请求但是没有收到失败或成功的正在上报中的数据。
- 本次合并上报的将要发送的数据数组（events）：循环遍历待上报数据对象中的数据，如果该数据不在上报中的，则将该数据 push 进将要发送的数据数组中。

## 其他

### 自定义合并上报数据存储

```ts
// 自定义待上报数据对象的存储与读取
// 放进 storage
reporter.setUnreportEventData = (data: Record<string, any>) => {
  wx.setStorage({
    key: 'unreportEventData',
    data,
  });
};
reporter.getUnreportEventData = () => {
  return wx.getStorageSync('unreportEventData');
};
```

### 备份上报

```ts
import { Report, ReportEvent } from 'report-core';

const reporter = new Report({
  url: 'xxx',
  backup: {
    url: 'xxx', // 备份地址
    filter: (events) => {
      // 上传到备份的
      if (events[0].type === 'xxx') {
        return true;
      }
      // 否则不上传到备份
      return false;
    },
  },
});
```

### 拦截上报

```ts
import { Report } from 'report-core';

const reporter = new Report({
  url: 'xxx',
  onReportBefore: (url: string, data: ReportRequestData, isImmediate: boolean) => {
    // 1、拦截不上报，return false
    // 2、修改这几个参数的值，然后返回最终的 url, data, isImmediate 值
    return {
      url,
      data,
      isImmediate,
    };
  },
});
```

### 不启动自动轮询上报

```ts
import { Report, ReportEvent } from 'report-core';

const reporter = new Report({
  url: 'xxx',
  pollIsOn: false,
});
```

## 整体设计脑图

![](ReportCore.png)
