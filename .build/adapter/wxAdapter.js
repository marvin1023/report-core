const wxAdapter = ({ url, data, onReportSuccess, onReportFail }) => {
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
        fail: (err) => {
            onReportFail(err);
        },
    });
};
export default wxAdapter;
