//!
//! Functions related to storing notebooks to local storage and keeping track of available notebooks
//!

import axios from 'axios';
//import localforage from 'localforage';
import { freshId } from './fresh.js';
import { parse, unparse } from './parser.js';

export async function get_notebooks() {
    const res = await axios.get(`/notebooks`);
    let results = res.data;
    // From server, results is now [ { identifier, name } ]
    // Convert to [ { identifier, name, title, location } ]
    results.map((item) => {
        item.title = item.name;
        item.location = 'server';
    });
    console.log(results);
    return res.data;
}

// Get contents for specific notebook
// info is entry from get_notebooks with same fields { identifier, name, title, location }
export async function get_notebook(item) {
    if (item.location === 'server') {
        const res = await axios.get(`/notebook/${item.identifier}`);
        const newnbstate = parse(res.data.contents);
        // Make sure new cells added to this notebook don't ever overlap existing cells
        freshId(newnbstate);
        return newnbstate;
    }
}

export async function set_notebook(item, state) {
    // Get notebook state as standard JS object without reactivity
    const unreactiveState = JSON.parse(JSON.stringify(state));
    // Convert from JSON format to PBNB format with unparse
    const unparsed = unparse(unreactiveState);
    console.log('Stubbed save of:', item, unparsed);
    // return await axios.post(`/notebook/${id}`, unparsed);
    return true;
}
