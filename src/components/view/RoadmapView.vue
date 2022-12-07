//!
//! RoadmapView
//!
//! A Vue component representing the roadmap landing page of site
//!

<template>
    <div class="container">
        <div class="content">
            <h2>Roadmap</h2>
            <p>
                The roadmap for this project is really "whatever I want to work on". That said, here are some of the things I'm thinking about.
            </p>
            <h3>Console and Editor</h3>
            <p>
                <ul>
                    <li>Minor interface tweaks to make using the console and editor easier and more intuitive. I'm always trying to make things better. One major inspiration here
                    is <a href="https://futurecoder.io/">futurecoder</a>.</li>
                    <li>Updating Python and Pyodide versions as they are available.</li>
                    <li>Testing more packages and adding examples to demonstrate them working.</li>
                </ul>
            </p>
            <h3>Accounts</h3>
            <p>
                <ul>
                    <li>User accounts - to allow saving files, manage work in progress (beyond local storage).</li>
                    <li>Publishing example code - for educational purposes, for showing demos.</li>
                    <li>Problems - idea is to have editor for solving programming challenges, submit solution and have it tested.</li>
                </ul>
            </p>
            <h3>Notebooks</h3>
            <p>
                I've done a bit of work in this direction but nothing ready for release yet. The idea is to have Jupyter style notebooks
                with cells that can contain Python code, Markdown text, or other types of content. There is already work to move Jupyter itself
                to the browser with <a href="https://jupyterlite.readthedocs.io/en/latest/">JupyterLite</a>, I don't want to reimplement the same thing. I'm more interested in experimenting with different ways of
                handling state in notebooks. Another project I'm investigating is <a href="https://github.com/mrzv/saturn">Saturn</a> notebooks, which
                is a plain text notebook system that handles checkpointing.
            </p>
            <h3>Free versus Paid Accounts</h3>
            <p>
                Right now everything on Nathan's Python Console is free for anyone to use. In the future I would like to add paid accounts that have features such as:
                <ul>
                    <li>Embedding - Publish working Python example code to your own blog, website, or other content management system. Include custom hidden
                    setup code if you want, choose to allow editing of code or not, and otherwise completely control how the embedded Python console works.</li>
                    <li>Custom hosted package management - Pick a set of packages, then get a set of files to easily serve from within the enterprise firewall. Users
                    from within the enterprise can connect and use the Python features and packages without ever sending traffic outside the enterprise network.</li>
                    <li>Notebook marketplace - I have a vision of a marketplace where
                    writers create high quality content in notebook format and sell it, with the marketplace helping to ensure all the code keeps working and tests
                    keep passing for every buyer. In this vision, paid accounts would have the ability to publish and sell notebooks.</li>
                </ul>
                I should add that everything in Nathan's Python Console is open source and there are no plans to change that in the future even with paid accounts.
            </p>
            <h3>Feedback</h3>
            <p>
                I'm interested in what directions you think this project should go. Have an idea? Suggestion? Please let me know either using the Feedback button
                or email me at <a href="mailto:nathan@pythonconsole.com">nathan@pythonconsole.com</a>.
            </p>
        </div>
    </div>
</template>
