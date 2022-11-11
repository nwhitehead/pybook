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
    <div class="box">
        <div class="content">
            <p class="subtitle is-4">Configuration</p>
            <template v-if="showGeneral">
                <p class="subtitle is-6">General</p>
                <p>
                    <input type="checkbox" id="darkmodeId" v-model="configuration.darkmode" />
                    <label for="darkmodeId"> Enable dark mode</label>
                </p>
                <p>
                    <input type="checkbox" id="disableFeedbackId" v-model="configuration.disableFeedback" />
                    <label for="disableFeedbackId"> Disable feedback tag</label>
                </p>
            </template>
            <template v-if="showConsole">
                <p class="subtitle is-6">Console</p>
                <p>
                    <input type="checkbox" id="evalSingleLineId" v-model="configuration.evalSingleLine" />
                    <label for="evalSingleLineId"> <span class="tag">Enter</span> evaluates single line input in console</label>
                </p>
                <p>
                    <input type="checkbox" id="wrapId" v-model="configuration.wrap" />
                    <label for="wrapId"> Wrap long lines</label>
                </p>
                <p>
                    <input type="checkbox" id="lineNumbersId" v-model="configuration.lineNumbers" />
                    <label for="lineNumbersId"> Show line numbers in multiline input</label>
                </p>
                <p>
                    <input type="checkbox" id="fixedHeightId" v-model="configuration.fixedHeight" />
                    <label for="fixedHeightId"> Fixed size</label>
                </p>
            </template>
            <template v-if="showEditor">
                <p class="subtitle is-6">Editor</p>
                <p>
                    <input type="checkbox" id="closeBracketsId" v-model="configuration.closeBrackets" />
                    <label for="closeBracketsId"> Close brackets/parentheses/quotes while typing</label>
                </p>
                <p>
                    <input type="checkbox" id="editLineNumbersId" v-model="configuration.editLineNumbers" />
                    <label for="editLineNumbersId"> Show line numbers</label>
                </p>
            </template>
            <template v-if="showPython">
                <p class="subtitle is-6">Python</p>
                <p>
                    <input type="checkbox" id="usePyPIid" v-model="configuration.usePyPI" />
                    <label for="usePyPIid"> Automatically install PyPI packages when used</label>
                </p>
            </template>
        </div>
    </div>
</template>

<script setup>

const props = defineProps([ 'configuration', 'showGeneral', 'showConsole', 'showEditor', 'showPython' ]);

</script>
