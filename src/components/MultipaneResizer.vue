<template>
    <div class="multipane-resizer">
        <span :class="resizerClasses()"><span class="material-icons">drag_handle</span></span>
    </div>
</template>

<style>
span.resizer {
    color: var(--grey-light);
    user-select: none;
    pointer-events: none;
    position: absolute;
}
span.resizer.vertical {
    transform: rotate(90deg);
    left: -5px;
    top: 50%;
}
span.resizer.horizontal {
    left: 50%;
    top: -9px;
}
</style>

<script setup>

const props = defineProps([ 'layout' ]);

function resizerClasses() {
    return {
        resizer:true,
        vertical: props.layout === 'vertical',
        horizontal: props.layout === 'horizontal',
    };
}
</script>
