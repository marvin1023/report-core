import { IAdapterOptions } from '../types';

const xhrAdapter = ({ url, data, onReportSuccess, onReportFail }: IAdapterOptions) => {
  const xhr = new XMLHttpRequest();
  xhr.open('POST', url);
  xhr.setRequestHeader('Content-type', 'application/json; charset=utf-8');
  xhr.send(JSON.stringify(data));

  xhr.onload = function () {
    if (xhr.status >= 200 && xhr.status < 300) {
      onReportSuccess();
    } else {
      onReportFail(new Error(`${xhr.status}: ${xhr.statusText}`));
    }
  };

  xhr.onerror = function () {
    onReportFail(new Error('请求失败'));
  };
};

export default xhrAdapter;
