import { wxAdapter } from './wxAdapter';
import { xhrAdapter } from './xhrAdapter';

export const getDefaultAdapter = () => {
  let adapter;
  if (typeof XMLHttpRequest !== 'undefined') {
    // For browsers use XHR adapter
    adapter = xhrAdapter;
  } else if (typeof wx !== 'undefined') {
    // For node use HTTP adapter
    adapter = wxAdapter;
  }
  return adapter;
};
