//!
//! TheNavbar
//!
//! A Vue component representing the top navbar on pages
//!

<template>

<nav class="navbar has-shadow" role="navigation" aria-label="main navigation">
    <div class="navbar-brand">
        <div class="nav-left">
            <img src="/static/gfx/logo.png" class="navbar-item" alt="Nathans Python Console" />
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
            <a class="navbar-item" href="/sab/#/configuration">Config</a>
            <div class="navbar-item has-dropdown is-hoverable">
                <a class="navbar-link">More</a>
                <div class="navbar-dropdown">
                    <a class="navbar-item" href="/#/about">About</a>
                    <a class="navbar-item" href="/#/roadmap">Roadmap</a>
                    <a class="navbar-item" href="/#/contact">Contact</a>
                    <hr class="navbar-divider">
                    <a class="navbar-item" href="/#/feedback">Report an issue</a>
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

let active = ref(false);

function flip() {
    active.value = !active.value;
}

</script>
