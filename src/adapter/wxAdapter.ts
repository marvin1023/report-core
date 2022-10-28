import { ReportAdapterOptions } from '../types';

export const wxAdapter = ({ url, data, timeout, onReportSuccess, onReportFail }: ReportAdapterOptions) => {
  wx.request({
    url,
    data,
    timeout,
    method: 'POST',
    header: {
      'Content-Type': 'application/json;charset=UTF-8',
    },
    success: () => {
      onReportSuccess?.();
    },
    fail: (err: Error) => {
      onReportFail?.(err);
    },
  });
};
