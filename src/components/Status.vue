
<template>
    <div class="status">
        <span class="material-icons" v-if="value=='Initializing'">cloud</span>
        <span class="material-icons" v-if="value=='Ready'">done</span>
        <span class="material-icons" v-if="value=='Working'">cloud</span>
        <span class="material-icons" v-if="value=='Interrupt'">report</span>
        <p>{{ value }}</p>
    </div>
</template>

<script>
export default {
    props: ['value']
}
</script>
