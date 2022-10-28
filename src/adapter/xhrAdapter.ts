import { ReportAdapterOptions } from '../types';

export const xhrAdapter = ({ url, timeout, data, onReportSuccess, onReportFail }: ReportAdapterOptions) => {
  const xhr = new XMLHttpRequest();
  xhr.open('POST', url);
  if (timeout) {
    xhr.timeout = timeout;
  }
  xhr.setRequestHeader('Content-type', 'application/json; charset=utf-8');
  xhr.send(JSON.stringify(data));

  xhr.onload = function () {
    if (xhr.status >= 200 && xhr.status < 300) {
      onReportSuccess?.();
    } else {
      onReportFail?.(new Error(`${xhr.status}: ${xhr.statusText}`));
    }
  };

  xhr.onerror = function () {
    onReportFail?.(new Error('请求失败'));
  };

  xhr.ontimeout = function () {
    onReportFail?.(new Error('请求失败'));
  };

  xhr.onabort = function () {
    onReportFail?.(new Error('请求失败'));
  };
};
