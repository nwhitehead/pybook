//!
//! TheNavbar
//!
//! A Vue component representing the top navbar on pages
//!
//! Emits:
//! - config - When config choice is chosen
//! - report - When "report issue" is chosen
//!

<template>

<nav class="navbar has-shadow" role="navigation" aria-label="main navigation">
    <div class="navbar-brand">
        <div class="nav-left">
            <img src="/gfx/logo.png" class="navbar-item" alt="Nathans Python Console" />
        </div>
        <a role="button" class="navbar-burger" aria-label="menu" aria-expanded="false" data-target="navbarBasicExample" @click="flip()">
            <span aria-hidden="true"></span>
            <span aria-hidden="true"></span>
            <span aria-hidden="true"></span>
        </a>
    </div>

    <div :class="{ 'navbar-menu':true, 'is-active':active }">
        <div class="navbar-start">
            <a class="navbar-item" href="/#/">Home</a>
            <a class="navbar-item" href="/sab/#/console">Console</a>
            <a class="navbar-item" href="/sab/#/code">Editor</a>
            <a class="navbar-item" href="/sab/#/usage">Usage</a>
            <a class="navbar-item" @click="$emit('config')">Config</a>
            <div class="navbar-item has-dropdown is-hoverable">
                <a class="navbar-link">More</a>
                <div class="navbar-dropdown">
                    <a class="navbar-item" href="/sab/#/about">About</a>
                    <a class="navbar-item" href="/sab/#/roadmap">Roadmap</a>
                    <hr class="navbar-divider">
                    <a class="navbar-item" @click="$emit('report')">Report an issue</a>
                </div>
            </div>
        </div>
        <div class="navbar-end">
            <div class="navbar-item">
                <div class="buttons">
                </div>
            </div>
        </div>
    </div>
</nav>

</template>

<script setup>

import { ref } from 'vue';

const emit = defineEmits([ 'config', 'report' ]);

let active = ref(false);

function flip() {
    active.value = !active.value;
}

</script>
