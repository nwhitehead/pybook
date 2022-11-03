//!
//! Feedback component
//!
//! Has no props, not configurable yet.
//!
//! Emits:
//! - send - Emit when user sends feedback. Has payload:
//!     - choice - Which category, 'issue', 'idea', 'other'
//!     - message - What user typed into textbox
//!     - email - Optional email address
//!
//! Feedback form clears itself after sending, except email stays if entered.
//!

<template>
    <div>
        <p class="title is-4">Send feedback</p>

        <div class="tabs is-toggle is-toggle-rounded">
            <ul>
                <li :class="choiceClass('issue')">
                    <a @click="choose('issue')">
                        <span class="icon is-small"><span class="material-icons">priority_high</span></span><span>Issue</span>
                    </a>
                </li>
                <li :class="choiceClass('idea')">
                    <a @click="choose('idea')">
                        <span class="icon is-small"><span class="material-icons">lightbulb</span></span><span>Idea</span>
                    </a>
                </li>
                <li :class="choiceClass('other')">
                    <a @click="choose('other')">
                        <span class="icon is-small"><span class="material-icons">chat</span></span><span>Other</span>
                    </a>
                </li>
            </ul>
        </div>

        <div v-if="choice !== ''">
            <div class="field">
                <div class="control">
                    <textarea class="textarea" :placeholder="placeholder()" v-model="message"></textarea>
                </div>
            </div>

            <div class="field">
                <div class="control has-icons-left">
                    <input id="email" name="email" class="input" type="email" placeholder="Email address (if you want a response)" v-model="email">
                    <span class="icon is-left"><span class="material-icons">mail</span></span>
                </div>
            </div>

            <div class="field is-grouped">
                <div class="control">
                    <button class="button is-link" @click="send">Send</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>

import { ref } from 'vue';

const emit = defineEmits([ 'send' ]);

let choice = ref('');
let message = ref('');
let email = ref('');

function placeholder() {
    if (choice.value === 'idea') {
        return "I'd like to see...";
    }
    if (choice.value === 'issue') {
        return "I'm having an issue with...";
    }
    if (choice.value === 'other') {
        return "I think...";
    }
}

function choose(which) {
    choice.value = which;
}

function choiceClass(which) {
    return {
        'is-active': choice.value === which,
    };
}

function send() {
    emit('send', { choice:choice.value, message:message.value, email:email.value });
    choice.value = '';
    message.value = '';
}

</script>
