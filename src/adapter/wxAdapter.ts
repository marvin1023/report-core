import { IAdapterOptions } from '../types';

const wxAdapter = ({ url, data, onReportSuccess, onReportFail }: IAdapterOptions) => {
  wx.request({
    url,
    data,
    method: 'POST',
    header: {
      'Content-Type': 'application/json;charset=UTF-8',
    },
    success: () => {
      onReportSuccess();
    },
    fail: (err: Error) => {
      onReportFail(err);
    },
  });
};

export default wxAdapter;
