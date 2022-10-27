//!
//! Functions related to storing notebooks to local storage and keeping track of available notebooks
//!

import axios from 'axios';
import localforage from 'localforage';
import { freshId } from './fresh.js';
import { parse, unparse } from './parser.js';

export async function get_local_notebooks() {
    let results = await localforage.getItem(`/notebooks`);
    if (results === null) {
        results = [];
    }
    return results;
}

// Note that the notebooks value should be unreactive
export async function set_local_notebooks(notebooks) {
    let result = await localforage.setItem(`/notebooks`, notebooks);
}

async function get_server_notebooks() {
    const res = await axios.get(`/notebooks`);
    let results = res.data;
    // From server, results is now [ { identifier, name } ]
    // Convert to [ { identifier, name, title, location } ]
    results.map((item) => {
        item.title = item.name;
        item.location = 'server';
    });
    return results;
}

export async function get_notebooks() {
    const server_notebooks_promise = get_server_notebooks();
    const local_notebooks_promise = get_local_notebooks();
    const server_notebooks = await server_notebooks_promise;
    const local_notebooks = await local_notebooks_promise;
    return [ ...server_notebooks, ...local_notebooks];
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
    const id = item.identifier;
    if (item.location === 'server') {
        // FIXME
        // Currently disable saving to server, let front-end copy server notebooks to make changes
        return false;
        // await axios.post(`/notebook/${id}`, unparsed);
        // return true;
    }
    if (item.location === 'local') {
        await localforage.setItem(`/notebook/${id}`, unparsed);
        return true;
    }
    return false;
}

// choices is array of existing notebook choices
// item is currently chosen item to use as base for copy to new notebook
export async function new_notebook(choices, item) {
    let maxid = 0;
    for (let i = 0; i < choices.length; i++) {
        maxid = Math.max(maxid, choices[i].identifier);
    }
    const identifier = maxid + 1;
    const result = { identifier, name:`Copy of ${item.name}`, title:item.title, location:'local' };
    return result;
}
