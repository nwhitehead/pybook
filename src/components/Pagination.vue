
<template>

<nav class="pagination" role="navigation" aria-label="pagination">
        <a class="pagination-previous" v-on:click="pagePrevious"><span class="material-icons">navigate_before</span></a>
        <a class="pagination-next" v-on:click="pageNext"><span class="material-icons">navigate_next</span></a>
        <ul class="pagination-list">
            <li v-for="p in paginate">
            <a v-if="p !== -1" class="pagination-link" v-on:click="handlePage(p - 1)" v-bind:class="{ 'is-current': p === current + 1 }" :aria-label="p">{{p}}</a>
            <span v-if="p === -1" class="pagination-ellipsis">&hellip;</span>
            </li>
        </ul>
    </nav>

</template>

<script>

export default {
    props: ['pages', 'current'],
    computed: {
        paginate: function() {
            // Simple case is not too many pages, just show them all in this case
            const pages = this.pages;
            let prePages = 3;
            let postPages = 3;
            if (pages <= 2 + 2 + prePages + 1 + postPages) {
                let result = [];
                for (let i = 0; i < pages; i++) {
                    result.push(i + 1);
                }
                return result;
            }
            const page = this.current + 1;
            var result = [];
            result.push(1);
            var start = page - prePages;
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
            var end = page + postPages;
            if (end >= pages - 1) {
                start -= end - (pages - 1) + 1;
                end = pages - 2;
            }
            for (var i = start; i <= end; i++) {
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
        },
    },
    methods: {
        pagePrevious: function() {
            this.$emit('page-previous');
        },
        pageNext: function() {
            this.$emit('page-next');
        },
        handlePage: function(p) {
            this.$emit('page', p);
        },
    },
}

</script>
