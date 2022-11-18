//!
//! TheNavbar
//!
//! A Vue component representing the top navbar on pages
//!
//! Props:
//! - dark - True if should be shown in dark mode
//!

<template>

<nav :class="{ navbar:true, 'has-shadow':true, dark:dark }" role="navigation" aria-label="main navigation">
    <div class="navbar-brand">
        <div class="nav-left">
            <img src="/static/gfx/logo.png" class="navbar-item" alt="Nathans Python Console" />
        </div>
        <a role="button" class="navbar-burger" aria-label="menu" aria-expanded="false" data-target="navbarBasicExample">
            <span aria-hidden="true"></span>
            <span aria-hidden="true"></span>
            <span aria-hidden="true"></span>
        </a>
    </div>

    <div id="navbarBasicExample" class="navbar-menu">
        <div class="navbar-start">
            <a class="navbar-item" href="#/">Home</a>
            <a class="navbar-item" href="#/console">Console</a>
            <a class="navbar-item" href="#/code">Editor</a>
            <a class="navbar-item" href="#/usage">Usage</a>
            <a class="navbar-item" href="#/configuration">Config</a>
            <div class="navbar-item has-dropdown is-hoverable">
                <a class="navbar-link">More</a>
                <div class="navbar-dropdown">
                    <a class="navbar-item" href="#/about">About</a>
                    <a class="navbar-item" href="#/roadmap">Roadmap</a>
                    <a class="navbar-item" href="#/contact">Contact</a>
                    <hr class="navbar-divider">
                    <a class="navbar-item" href="#/feedback">Report an issue</a>
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

const props = defineProps([ 'dark' ]);

</script>
