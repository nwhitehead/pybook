//!
//! MainView
//!
//! A Vue component representing the main landing page of site
//!

<template>
    <div class="content">
        <h2>Python Console</h2>
        <p>
            The <a href="#/console">Python Console</a> is an online Python interpreter that runs entirely in your browser.
            It lets you quickly try out Python ideas while being as similar to the normal Python command line interpreter as possible.
            No setup is needed. Packages automatically install when you import them.
        </p>
        <figure>
            <a href="#/console">
                <img src="/static/gfx/console.png" alt="Screenshot showing the Python Console and a hello print command." />
            </a>
            <figcaption>Screenshot showing the Python Console and a "Hello, browser" print command.</figcaption>
        </figure>
        <h2>Python Editor</h2>
        <p>
            The <a href="#/code">Python Editor</a> is a simple Python development environment. It has a program editor on the left side
            and a Python console on the right side. Press the "Play" button to execute your code and see the results in the console. You can
            also interact directly with the Python console.
        </p>
        <figure>
            <a href="#/code">
                <img src="/static/gfx/editor.png" alt="Screenshot showing editor doing factorial" />
            </a>
            <figcaption>Screenshot showing the Python Editor with a simple factorial function.</figcaption>
        </figure>
        <h2>Why use this</h2>
        <p>Some of the reasons you might want to use these Python Console tools:</p>
        <ul>
            <li><em>Simplicity</em></li>
            <p>You don't need to setup Python, install packages, and mess around with configuration to get things done. You may appreciate this if you often switch around
            between different computers and environments.
            </p>
            <li><em>Features</em></li>
            <p>Many packages are supported without any setup needed. You can also directly output graphics and sound to the browser without going through other
            programs to preview your output.
            </p>
            <li><em>Demonstration</em></li>
            <p>If you want to show off Python code to demonstrate something, it is convenient to point people to a place where they can see the demonstration
            immediately without any barriers to getting started.
            </p>
        </ul>
        <p>For more examples of what can be done with the Python Console tools, see the <a href="#/usage">Usage Guide</a>.
        </p>
        <!-- <p>Some of the reasons you might <b>not</b> want to use these Python Console tools:</p>
        <ul>
            <li><em>Performance</em></li>
            <p>While running Python in the browser can be surprisingly fast, if your program is performance limited then running it in the browser
            may not be the best choice.</p>
            <li><em>Local files</em></li>
            <p>If you need to work with local files then using these Python Console tools may not be the best choice. The filesystem that is exposed
            to Python here allows you to read and write temporary files that persist as long as the Python interpreter is running. Python code cannot
            read, modify, or save new local files.
            </p>
        </ul> -->
    </div>
</template>
