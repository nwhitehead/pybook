//!
//! Multipane
//!
//! A Vue component to allow horizontal or vertical divisions between panels. Optionally with draggable dividers.
//!
//! Props:
//! - layout - Either 'vertical' or 'horizontal' string
//!
//! Emits:
//! - 

<template>
  <div :class="classnames" :style="divStyle" @mousedown="onMouseDown" ref="container">
    <slot></slot>
  </div>
</template>

<style>
.multipane {
    display: flex;
}
.multipane.layout-h {
    flex-direction: column;
}
.multipane.layout-v {
    flex-direction: row;
}
.multipane > div {
    position: relative;
    z-index: 1;
}
.layout-h > .multipane-resizer {
    width: auto;
    height: 10px;
    cursor: row-resize;
    display: block;
    z-index: 2 !important;
}
.layout-v > .multipane-resizer {
    width: 10px;
    height: auto;
    cursor: col-resize;
    display: block;
    z-index: 2 !important;
    margin-right: -10px;
    left: -5px;
    flex-shrink: 0;
}
.layout-v > .multipane-resizer:before {
    content: '';
    position: absolute;
    left: 4px;
    top: 0;
    width: 0;
    height: 100%;
    border-left: 1px dotted #888;
}
</style>

<script setup>

import { ref, computed } from 'vue';

const container = ref(null);

const props = defineProps({
    layout: {
        type: String,
        default: 'vertical',
    }
});

const emit = defineEmits([ 'paneResize', 'paneResizeStart', 'paneResizeStop' ]);

const isResizing = ref(false);

const classnames = computed(() => {
    return [
        'multipane',
        'layout-' + props.layout.slice(0, 1),
        isResizing.value ? 'is-resizing' : '',
    ];
});

const divStyle = computed(() => {
    return {
        'cursor': !isResizing.value ? '' : (props.layout === 'vertical' ? 'col-resize' : 'row-resize'),
        'userSelect': isResizing.value ? 'none' : '',
    };
});

function onMouseDown(evt) {
    //{ target: resizer, pageX: initialPageX, pageY: initialPageY }
    const target = evt.target;
    if (!evt.target.className || !evt.target.className.match('multipane-resizer')) {
        return;
    }
    const initialPageX = evt.pageX;
    const initialPageY = evt.pageY;
    let pane = evt.target.previousElementSibling;
    let initialPaneWidth = pane.offsetWidth;
    let initialPaneHeight = pane.offsetHeight;
    const style = getComputedStyle(pane);

    const resize = (initialSize, offset = 0) => {
        console.log(`Resize ${initialSize} - ${offset}`);
        if (initialSize === undefined) {
            return props.layout === 'vertical' ? initialPaneWidth : initialPaneHeight;
        }
        if (props.layout === 'vertical') {
            const v = (initialSize + offset) + 'px';
            pane.style.width = v;
            return v;
        }
        if (props.layout === 'vertical') {
            const v = (initialSize + offset) + 'px';
            pane.style.height = v;
            return v;
        }
    };

    isResizing.value = true;
    function onMouseMove({ pageX, pageY }) {
        if (props.layout === 'vertical') {
            resize(initialPaneWidth, pageX - initialPageX);
        } else {
            resize(initialPaneHeight, pageY - initialPageY);
        }
    }
    function onMouseUp() {
        isResizing.value = false;
        removeEventListener('mousemove', onMouseMove);
        removeEventListener('mouseup', onMouseUp);
    }
    addEventListener('mousemove', onMouseMove);
    addEventListener('mouseup', onMouseUp);
}

</script>
