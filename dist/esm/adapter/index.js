import wxAdapter from './wxAdapter.js';
import xhrAdapter from './xhrAdapter.js';

function getDefaultAdapter() {
    let adapter;
    if (typeof XMLHttpRequest !== 'undefined') {
        // For browsers use XHR adapter
        adapter = xhrAdapter;
    }
    else if (typeof wx !== 'undefined') {
        // For node use HTTP adapter
        adapter = wxAdapter;
    }
    return adapter;
}

export { getDefaultAdapter as default };
