declare function getDefaultAdapter(): (({ url, data, onReportSuccess, onReportFail }: import("..").IAdapterOptions) => void) | undefined;
export default getDefaultAdapter;
