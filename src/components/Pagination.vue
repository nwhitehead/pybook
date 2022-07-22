//!
//! Pagination
//!
//! This Vue component shows numbered buttons representing pages. If there are too many pages, may show dots representing ranges.
//!
//! Props:
//! - pages - Number of pages possible.
//! - current - Number of current page in [0, pages-1]
//!
//! Events emitted:
//! - page - Payload p (Directly switch to page p)

<template>

<nav class="pagination" role="navigation" aria-label="pagination">
        <a class="pagination-previous" @click="pagePrevious"><span class="material-icons">navigate_before</span></a>
        <a class="pagination-next" @click="pageNext"><span class="material-icons">navigate_next</span></a>
        <ul class="pagination-list">
            <li v-for="p in paginate()">
                <a v-if="p !== -1" class="pagination-link" @click="pageGoto(p - 1)" :class="{ 'is-current': p === current + 1 }" :aria-label="p">{{p}}</a>
                <span v-if="p === -1" class="pagination-ellipsis">&hellip;</span>
            </li>
        </ul>
    </nav>

</template>

<script setup>

const props = defineProps([ 'pages', 'current' ]);
const emit = defineEmits([ 'page' ]);

//! For current prop values, return array of page numbers to display (with -1 for dots)
//! Note that page numbers to display are from [1, pages]
//!
function paginate () {
    // Simple case is not too many pages, just show them all in this case
    const pages = props.pages;
    let prePages = 3;
    let postPages = 3;
    if (pages <= 2 + 2 + prePages + 1 + postPages) {
        let result = [];
        for (let i = 0; i < pages; i++) {
            result.push(i + 1);
        }
        return result;
    }
    const page = props.current + 1;
    let result = [];
    result.push(1);
    let start = page - prePages;
    if (start <= 3) {
        // If there is not enough room for first ellipsis,
        // put pages in that spot instead.
        postPages += 3 - start;
        start = 3;
    }
    if (start >= 3) {
        // If we would just put ... but the page would do as nicely, put the page
        if (start == 3) {
            result.push(2);
        } else {
            result.push(-1);
        }
    }
    let end = page + postPages;
    if (end >= pages - 1) {
        start -= end - (pages - 1) + 1;
        end = pages - 2;
    }
    for (let i = start; i <= end; i++) {
        result.push(i);
    }
    if (end <= pages - 2) {
        if (end == pages - 2) {
            result.push(pages - 1);
        } else {
            result.push(-1);
        }
    }
    result.push(pages);
    return result;
}

function pagePrevious () {
    const p = props.current - 1;
    if (p >= 0) {
        emit('page', p);
    }
}

function pageNext () {
    const p = props.current + 1;
    if (p < props.pages) {
        emit('page', p);
    }
}

function pageGoto (p) {
    emit('page', p);
}

</script>
