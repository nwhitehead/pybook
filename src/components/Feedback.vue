//!
//! Feedback component
//!
//! Props:
//! - active - Whether to show modal overlay (starts false, should be set to true when active emit sent)
//! - disable - Set to true to disable tag from showing at all
//!
//! Emits:
//! - update:active - Sent when feedback button clicked, expected to set active prop to value in payload
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
    <div :class="{ modal:true, 'is-active':props.active }">
        <div class="modal-background" @click="$emit('update:active', false); thanks=false"></div>
        <div class="modal-card">

            <div class="modal-card-body" v-if="!thanks">
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

                    <div class="field">
                        <div class="control">
                            <input type="checkbox" id="screenshotId" v-model="screenshot" />
                            <label for="screenshotId"> Include screenshot</label>
                        </div>
                    </div>

                    <div class="field is-grouped">
                        <div class="control">
                            <button class="button is-link" @click="if (readyToSend()) { send(); }">Send</button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-card-body" v-if="thanks">
                <p class="title is-4">Thank you for your feedback!</p>
            </div>
            <button class="modal-close is-large" aria-label="close" @click="$emit('update:active', false); thanks=false"></button>
        </div>
    </div>
    <div v-if="!disable" class="fixed"><button class="feedbackbutton" @click="$emit('update:active', true);"><span>Feedback</span></button></div>
</template>

<style>
.fixed {
    position: fixed;
    top: 0px;
    right: 100px;
    float: right;
    z-index: 200;
    width: 0;
    height: 0;
}
@media screen and (min-width: 1024px) {
.fixed {
    position: fixed;
    top: 40vh;
    left: 0;
}
}

.feedbackbutton {
    display: inline-block;
    border: 2px solid var(--feedback-button-bg);
    border-bottom-right-radius: 10px;
    border-bottom-left-radius: 10px;
    border-left: none;
    border-right: none;
    border-top: 5px solid var(--feedback-button-bg);
    padding: 7px;
    margin: 0px;
    background-color: var(--feedback-button-bg);
    color: var(--feedback-button-fg);
    transform-origin: top left;
    transform: translate(0px, -3px);
    font-size: 1em;
}
.feedbackbutton:hover {
    transform: translate(0px, 0px);
}
@media screen and (min-width: 1024px) {
.feedbackbutton {
    display: inline-block;
    border: 2px solid var(--feedback-button-bg);
    border-bottom-right-radius: 10px;
    border-bottom-left-radius: 10px;
    border-left: none;
    border-right: none;
    border-top: 5px solid var(--feedback-button-bg);
    padding: 7px;
    margin: 0px;
    background-color: var(--feedback-button-bg);
    color: var(--feedback-button-fg);
    transform-origin: top left;
    transform: rotate(-90deg) translate(0px, -3px);
    font-size: 1em;
}
.feedbackbutton:hover {
    transform: rotate(-90deg);
}
}

[data-theme="dark"] div.modal-card-body {
    background-color: var(--light);
    color: var(--dark);
}

[data-theme="dark"] div.modal-card-body a {
    color:var(--dark);
    background-color:var(--light);
}

[data-theme="dark"] div.modal-card-body p.title {
    color:var(--dark);
}

[data-theme="dark"] div.modal-card-body a:hover {
    color:var(--dark);
    background-color:var(--grey-light);
}

[data-theme="dark"] div.modal-card-body li.is-active a {
    color:var(--light);
    background-color:var(--blue);
}

[data-theme="dark"] div.modal-card-body li.is-active a:hover {
    color:var(--light);
    background-color:var(--blue);
}

[data-theme="dark"] .modal-card-body textarea {
    color:var(--dark);
    background-color:var(--light);
}

[data-theme="dark"] .modal-card-body textarea::placeholder {
    color:var(--grey);
}

[data-theme="dark"] .modal-card-body input[type=email] {
    color:var(--dark);
    background-color:var(--light);
}

[data-theme="dark"] .modal-card-body input[type=email]::placeholder {
    color:var(--grey);
}
</style>

<script setup>

import { ref, watch, nextTick } from 'vue';
import html2canvas from 'html2canvas';

const props = defineProps([ 'active', 'disable' ]);
const emit = defineEmits([ 'update:active', 'send' ]) ;

let choice = ref('');
let message = ref('');
let screenshot = ref(false);
let thanks = ref(false); // whether to show thanks screen while active or not

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

function scheduleAutoClose() {
    setTimeout(() => {
        emit('update:active', false);
        thanks.value = false;
    }, 3000);
}

function send() {
    let payload = { choice:choice.value, message:message.value, email:email.value, location:document.location.href };
    if (screenshot.value) {
        // Turn off modal to get screenshot (otherwise we are screenshotting the feedback form...)
        emit('update:active', false);
        nextTick(() => {
            html2canvas(document.body).then((canvas) => {
                payload.screenshot = canvas.toDataURL('image/png');
                emit('send', payload);
                choice.value = '';
                message.value = '';
                emit('update:active', true);
                thanks.value = true;
                scheduleAutoClose();
            });
        });
    } else {
        emit('send', payload);
        choice.value = '';
        message.value = '';
        emit('update:active', true);
        thanks.value = true;
        scheduleAutoClose();
    }
}

</script>
