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
            <a class="navbar-item" href="/">Home</a>
            <a class="navbar-item" href="/console.html">Console</a>
            <a class="navbar-item" href="/code.html">Editor</a>
            <a class="navbar-item" href="/hint.html">Usage</a>
            <div class="navbar-item has-dropdown is-hoverable">
                <a class="navbar-link">More</a>
                <div class="navbar-dropdown">
                    <a class="navbar-item" href="/about.html">About</a>
                    <a class="navbar-item" href="/roadmap.html">Roadmap</a>
                    <a class="navbar-item" href="/contact.html">Contact</a>
                    <hr class="navbar-divider">
                    <a class="navbar-item" href="/feedback.html">Report an issue</a>
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
    /* Fix shadow in dark mode to be darker */
    box-shadow: 0 2px 0 0 #444;
}
nav.navbar.dark .navbar-item {
    color: #ddd;
}
nav.navbar.dark .navbar-item:hover {
    background-color: #222;
    color: #ddd;
}
nav.navbar.dark .navbar-link {
    background-color: #000;
    color: #ddd;
}
nav.navbar.dark .navbar-link:hover {
    background-color: #222;
    color: #ddd;
}
nav.navbar.dark .navbar-dropdown
{
    background-color: #111;
    color: #ddd;
}
nav.navbar.dark .navbar-item.has-dropdown {
    background-color: #000;
    color: #ddd;
}
</style>

<script setup>

const props = defineProps([ 'dark' ]);

</script>
