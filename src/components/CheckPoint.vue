
<template>
    <div class="tags are-medium has-addons">
        <span :class="checkpointClassLeft">{{ checkpointText() }}</span>
        <span :class="checkpointClassMiddle">{{ value }}</span>
    </div>
</template>

<script>

export default {
    props: ['value', 'type'],
    computed: {
        checkpointClassLeft () {
            return {
                'tag': true,
                'is-primary': this.type === 'save',
                'is-link': this.type === 'use',
            }
        },
        checkpointClassMiddle () {
            return {
                'tag': true,
            }
        },
    },
    methods: {
        checkpointText: function() {
            if (this.type === 'save') return 'Save';
            if (this.type === 'use') return 'From';
            throw "Illegal checkpoint type";
        },
    }
}
</script>
