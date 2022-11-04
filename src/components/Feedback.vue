//!
//! Feedback component
//!
//! Props:
//! - disable - Set to true to disable tag from showing at all
//!
//! Emits:
//! - send - Emitted when feedback is to be sent, has payload with fields:
//!     - choice - One of 'issue', 'idea', 'other'
//!     - message - What user typed
//!     - email - Email address if entered (not validated)
//!     - screenshot - data URL encoded string showing what user was looking at (hopefully)
//!     - location - URL when feedback activated
//!
//! Feedback form clears itself after sending, except email stays if entered.
//!

<template>
    <div :class="{ 'modal':true, 'is-active':active }">
        <div class="modal-background"></div>
        <div class="modal-card">

            <div class="modal-card-body">
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
                            <button class="button is-link" @click="if (readyToSend()) { send(); }">Send</button>
                        </div>
                    </div>
                </div>
            </div>
            <button class="modal-close is-large" aria-label="close" @click="active=false"></button>
        </div>
    </div>
    <div v-if="!disable" class="fixed"><button class="feedbackbutton" @click="active=true"><span>Feedback</span></button></div>
</template>

<style>
.fixed {
    position: fixed;
    top: 40vh;
    left: 0;
}
.feedbackbutton {
    display: inline-block;
    border: 2px solid #000;
    border-bottom-right-radius: 10px;
    border-bottom-left-radius: 10px;
    border-left: none;
    border-right: none;
    border-top: 5px solid #000;
    padding: 7px;
    margin: 0px;
    background-color: #000;
    color: #fff;
    transform-origin: top left;
    transform: rotate(-90deg) translate(0px, -5px);
    font-size: 1em;
}
.feedbackbutton:hover {
    transform: rotate(-90deg);
}
</style>

<script setup>

import { ref, watch, nextTick } from 'vue';
import html2canvas from 'html2canvas';

const props = defineProps([ 'disable' ]);
const emit = defineEmits([ 'send' ]);

let active = ref(false); // When active, modal takes over all display

let choice = ref('');
let message = ref('');

function getLocalStorage(tag, defaultValue) {
    const stored = localStorage.getItem(tag);
    return stored === null ? defaultValue : stored;
}

const email = ref(getLocalStorage('email', ''));
watch(email, (newValue) => {
    localStorage.setItem('email', newValue);
});

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

function readyToSend() {
    if (choice.value === '') {
        return false;
    }
    if (message.value === '' && email.value === '') {
        return false;
    }
    return true;
}

function send() {
    // Turn off modal to get screenshot (otherwise we are screenshotting the feedback form...)
    active.value = false;
    nextTick(() => {
        html2canvas(document.body).then((canvas) => {
            const base64image = canvas.toDataURL('image/jpeg', 0.5);
            const payload = { choice:choice.value, message:message.value, email:email.value, location:document.location.href, screenshot:base64image };
            emit('send', payload);
            choice.value = '';
            message.value = '';
            active.value = false;
        });
    });
}

</script>
