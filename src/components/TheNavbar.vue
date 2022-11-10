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
            <img src="logo.png" class="navbar-item" alt="Nathans Python Console" />
        </div>
        <a role="button" class="navbar-burger" aria-label="menu" aria-expanded="false" data-target="navbarBasicExample">
            <span aria-hidden="true"></span>
            <span aria-hidden="true"></span>
            <span aria-hidden="true"></span>
        </a>
    </div>

    <div id="navbarBasicExample" class="navbar-menu">
        <div class="navbar-start">
            <a class="navbar-item">Home</a>
            <a class="navbar-item">Hints</a>
            <div class="navbar-item has-dropdown is-hoverable">
                <a class="navbar-link">More</a>
                <div class="navbar-dropdown">
                    <a class="navbar-item">About</a>
                    <a class="navbar-item">Roadmap</a>
                    <a class="navbar-item">Contact</a>
                    <hr class="navbar-divider">
                    <a class="navbar-item">Report an issue</a>
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

<style>

nav.navbar.dark {
    background-color: #000;
    color: #ddd;
}
nav.navbar.dark img {
    filter: invert(1) hue-rotate(180deg);
}
nav.navbar.dark.has-shadow {
    box-shadow: 0 2px 0 0 #444;
}

</style>

<script setup>

const props = defineProps([ 'dark' ]);

</script>
