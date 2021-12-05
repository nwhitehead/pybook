
import Vue from 'vue';
import Vuex from 'vuex';

function newCell() {
    return {
        cell_type: 'code',
        source: '',
        evalstate: '',
        outputs: [],
        metadata: {}
    };
}

function newPage() {
    return [ newCell() ];
}

Vue.use(Vuex);

const store = new Vuex.Store({
    state: {
        cells: [newPage()],
    },
    mutations: {
        newNotebook (state) {
            Vue.set(state, 'cells', [newPage()]);
        },
        setSource (state, payload) {
            Vue.set(state.cells[payload.p][payload.n], 'source', payload.source);
        },
        clearOutput (state, payload) {
            Vue.set(state.cells[payload.p][payload.n], 'outputs', []);
        },
        addOutput (state, payload) {
            state.cells[payload.p][payload.n].outputs.push(payload.out);
        },
        setCellState (state, payload) {
            const value = payload.state;
            if (value !== '' && value !== 'working' && value !== 'evaluated') {
                throw "Illegal cell state";
            }
            Vue.set(state.cells[payload.p][payload.n], 'state', payload.state);
        },
        setCellEvalState (state, payload) {
            Vue.set(state.cells[payload.p][payload.n], 'evalstate', payload.evalstate);
        },
        insertCellBefore (state, payload) {
            state.cells[payload.p].splice(payload.n, 0, newCell());
        },
        insertCellAfter (state, payload) {
            state.cells[payload.p].splice(payload.n + 1, 0, newCell());
        },
        insertPageBefore (state, payload) {
            state.cells.splice(payload.p, 0, newPage());
        },
        insertPageAfter (state, payload) {
            state.cells.splice(payload.p + 1, 0, newPage());
        },
        deletePage (state, payload) {
            state.cells.splice(payload.p, 1);
        },
        deleteCell (state, payload) {
            state.cells[payload.p].splice(payload.n, 1);
        },
        updateCells (state, payload) {
            Vue.set(state.cells, payload.p, payload.cells);
        },
        moveCell (state, payload) {
            const page = state.cells[payload.p];
            const cell = page[payload.n];
            page.splice(payload.n, 1); // remove cell
            page.splice(payload.position, 0, cell); // add original cell
        },
        movePage (state, payload) {
            const page = state.cells[payload.p];
            state.cells.splice(payload.p, 1); // remove page
            state.cells.splice(payload.position, 0, page); // add original page
        },
        cellSetFlag (state, payload) {
            // payload has:
            //   p: page
            //   n: cell num
            //   flag: flag name  (in 'hidden', 'readonly')
            //   value: true or false
            Vue.set(state.cells[payload.p][payload.n].metadata, payload.flag, payload.value);
        },
        cellType (state, payload) {
            Vue.set(state.cells[payload.p][payload.n], 'cell_type', payload.type);
            if (payload.subtype !== undefined) {
                Vue.set(state.cells[payload.p][payload.n].metadata, 'subtype', payload.subtype);
            }
        },
        initializeObject (state, payload) {
            this.replaceState(Object.assign(state, payload));
        },
        initializeString (state, payload) {
            const parsed = JSON.parse(payload);
            this.commit('initializeObject', parsed);
        },
        initializeStore (state, payload) {
            const stored = localStorage.getItem(payload);
            if (stored) {
                this.commit('initializeString', stored);
            }
            // Otherwise do nothing if no localStorage result
        }
    }
});

export default store;
