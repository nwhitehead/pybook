//!
//! Configuration
//!
//! A Vue component representing config options
//!
//! Props:
//! - configuration - Object with keys of all the options
//! - showGeneral - Show general options
//! - showConsole - Show options relevant to console
//! - showEditor - Show options relevant to editor
//! - showPython - Show options related to Python kernel
//!

<template>

<nav class="panel">

            <p class="panel-heading">Configuration</p>
            <template v-if="showGeneral">
                <div class="title-box">
                    <label class="label">General</label>
                    <div class="control">
                        <label><input type="checkbox" id="darkmodeId" v-model="configuration.darkmode" /> Enable dark mode</label>
                    </div>
                    <div class="control">
                        <label><input type="checkbox" id="disableFeedbackId" v-model="configuration.disableFeedback" /> Disable feedback tag</label>
                    </div>
                    <div class="control">
                        <label><input type="checkbox" id="closeBracketsId" v-model="configuration.closeBrackets" /> Auto close brackets/quotes while typing</label>
                    </div>
                    <div class="control">
                        <label><input type="checkbox" id="alternateInterruptId" v-model="configuration.alternateInterrupt" /> Use
                            <span class="tag">Ctrl</span>-<span class="tag">I</span> for interrupt instead of 
                            <span class="tag">Ctrl</span>-<span class="tag">C</span>.</label>
                    </div>
                </div>
            </template>
            <template v-if="showEditor">
                <div class="title-box">
                    <label class="label">Editor</label>
                    <div class="control">
                        <label><input type="checkbox" id="editLineNumbersId" v-model="configuration.editLineNumbers" /> Show line numbers</label>
                    </div>
                </div>
            </template>
            <template v-if="showConsole">
                <div class="title-box">
                    <label class="label">Console</label>
                    <div class="control">
                        <label><input type="checkbox" id="evalSingleLineId" v-model="configuration.evalSingleLine" /><span class="tag">Enter</span> evaluates single line input in console</label>
                    </div>
                    <div class="control">
                        <label><input type="checkbox" id="wrapId" v-model="configuration.wrap" /> Wrap long lines</label>
                    </div>
                    <div class="control">
                        <label><input type="checkbox" id="lineNumbersId" v-model="configuration.lineNumbers" /> Show line numbers in multiline input</label>
                    </div>
                    <div class="control">
                        <label><input type="checkbox" id="fixedHeightId" v-model="configuration.fixedHeight" /> Fixed full height</label>
                    </div>
                </div>
            </template>
            <template v-if="showPython">
                <div class="title-box">
                    <label class="label">Python</label>
                    <div class="control">
                        <label><input type="checkbox" id="usePyPIid" v-model="configuration.usePyPI" /> Automatically install PyPI packages when used</label>
                    </div>
                </div>
            </template>
</nav>

</template>

<script setup>

const props = defineProps([ 'configuration', 'showGeneral', 'showConsole', 'showEditor', 'showPython' ]);

</script>
