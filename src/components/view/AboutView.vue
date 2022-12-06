//!
//! AboutView
//!
//! A Vue component representing the about landing page of site
//!

<template>
    <div class="container">
        <div class="content">
            <h2>Technologies</h2>
            <p>
                To make the Python console tools work, here is a list of some of the technologies involved.
                <ul>
                    <li><a href="https://www.python.org/downloads/release/python-3100/">Python 3.10</a> - The language of choice for discriminating programmers.</li>
                    <li><a href="https://pyodide.org/en/stable/">Pyodide</a> - this allows Python to run in the browser and includes support for many packages.</li>
                    <li><a href="https://vuejs.org/">Vue.js</a> - web framework for the website, organized as a single page app (as much as possible).</li>
                    <li><a href="https://codemirror.net/">CodeMirror</a> - code editor for text input for console and editor, with syntax highlighting.</li>
                    <li><a href="https://bulma.io/">Bulma</a> - a CSS framework for styling the pages.</li>
                    <li><a href="https://vitejs.dev/">Vite</a> - for frontend building and development serving.</li>
                </ul>
                There are many more packages and tools involved in the project. The project itself is open source on GitHub
                at <a href="https://github.com/nwhitehead/pybook">https://github.com/nwhitehead/pybook</a>.
            </p>
            <h2>Features</h2>
            <p>
                A lot of the work for Nathan's Python Console tools was fixing small issues or making things work in non-obvious ways. Here is a list of
                some of the things involved.
                <ul>
                    <li>Interrupts - Pyodide supports interrupting Python execution. Getting this working consistently can be somewhat challenging. At the heart is a
                    <code>SharedArrayBuffer</code> that is shared between the main UI thread in the browser and a web worker thread running Python.</li>
                    <li>IO - Python in the web worker thread can perform IO operations including reading from <code>stdin</code> and synchronously writing
                    to <code>stdout</code>. This involves some plumbing for communicating and waiting on atomics in the <code>SharedArrayBuffer</code>.</li>
                    <li>REPL evaluation - The Python command line REPL behaves slightly differently from the Pyodide and Jupyter Python kernel. If you evaluate
                    something like <code>2; 3</code> then the Python REPL will show you both values. The Pyodide and Jupyter Python kernels will only show the last
                    value. Nathan's Pythonn Console behaves like the Python REPL and shows all the values by working through the AST of the compiled expression. It
                    optionally also inserts an arrow, which I think helps clarify which outputs are evaluated values and which are output directly.</li>
                    <li>Sleep - The Python kernel runs in a separate web worker so there is no problem if Python sleeps. The <code>time.sleep</code> function
                    is reassigned to an atomic wait on the <code>SharedArrayBuffer</code>.</li>
                    <li>Files - Pyodide enables the default Emscripten filesystem. Nathan's Python Console additionally sets up persistent storage at <code>/persistent</code>
                    using the <code>IDBFS</code> filesystem.</li>
                    <li>Auto PyPI import - This is a feature copied from <a href="https://futurecoder.io/">FutureCoder.io</a>. Using <code>micropip</code> packages from PyPI
                    are installed when imported.</li>
                    <li>PNG - I added <code>pypng</code> as the package to install when importing <code>png</code> (there is more than one choice here).</li>
                    <li><code>dill</code> - The <code>dill</code> package had some trouble with <code>/dev/null</code> that I managed to fix by setting up seek access to <code>/dev/null</code>
                    in the Emscripten filesystem.</li>
                    <li>Recursion limit - Some scientific packages hit the recursion depth limit during importso I set the default recursion limit to 250 which fixed the issues
                    and still allowed debugging infinite recursions without crashing Python inside the browser (at least on my system).</li>
                    <li>Security - Turning on <code>SharedArrayBuffers</code> requires some restrictive headers for web security reasons. For the design of the website I wanted some
                    external scripts (for email signups), I could not figure out how to mix the headers with things like iframes. I split out pages requiring no headers from others.</li>
                    <li>Styling - There are various syntax highlighting tools being used with different themes to help make editing code easier. I also tweaked things to work in dark
                    mode. I added JavaScript processing to handle some ANSI escape codes, but not too many. Nathan's Python Console is not a full terminal emulator.</li>
                </ul>
            </p>
            <h2>Personal Project History</h2>
            <p>
                I've been working on and off on this project for several years.
                My initial motivation was trying Emscripten and seeing that it
                actually worked pretty well at compiling things for the browser. I did some performance tests and was surprised that my test code ended up
                running at about half speed of being natively compiled. That made me think that compiling things for the browser was not just for toy demos
                but could be used for serious things. I played around with compiling various interpreters for languages such
                as Lua and Python and got some good results.
            </p>
            <p>
                When I saw Pyodide I was excited because it covered packages such as <code>numpy</code> and other scientific packages. These
                packages are tricky to get working in the browser because they include C and Fortran code and sometimes use complicated build procedures.
                Pyodide seemed like a good way to standardize on the Python-to-browser interface and to support lots of important packages in a clean way.
            </p>
            <p>
                My own motivation shifted from trying to get anything at all working to investigating what kinds of interesting things can be done in a nice
                way. I personally wanted a really good Python console in the browser to try things on. I also investigated different ways of interfacing Python
                to the browser. One thing I worked on a bit was copying the notebook inteface from Jupyter but tweaking it for educational purposes.
                I made some progress there, but I got frustrated
                by the Python state management of the notebook interface. Evaluating cells out of order can be confusing. Restarting the Python kernel
                halfway through a notebook into a blank state is even more confusing.
            </p>
            <p>
                I got more interested in reinventing the notebook interface to solve this problem. One motivating example is
                <a href="https://coq.inria.fr/refman/practical-tools/coqide.html">CoqIDE</a>. This is an editor that manages complicated state
                in a way that allows you to see what has been evaluated, the state of the current evaluation, and invalidated commands. My idea
                was to make something similar for Python. It would allow you to step forward and backward through a notebook and easily see what has
                been evaluated and what has been invalidated by an edit. You could evaluate a notebook up through the current cell, edit an earlier
                cell, then see the evaluation state snap back to the point in time for the older cell. I also had some ideas about explicit checkpoints
                to increase efficiency compared to an automatic checkpoint after every cell. I wrote some code to start working on this
                updated notebook interface but this remains a work in progress. 
            </p>
            <p>
                The current Python Console project is focused on releasing a polished Python console in the browser and a simple Python code editor
                in the browser. The goal is to get something useful and working up and running and available to everyone. Having a working console
                is also a prerequisite to a more complicated interface anyway.
            </p>
            <h2>About Me</h2>
            <p>
                I'm Nathan, I'm a programmer that likes working on different things. Lately I've been working on Nathan's Python Console and
                related things. I'm also writing some programming lessons on various topics.
            </p>
            <p>
                My <a href="https://github.com/nwhitehead">GitHub profile</a>. I also have lots of secret unpublished projects. In my professional life
                I've worked on CUDA, low power device performance, and TensorRT for deep learning inference. I also taught a bunch of computer science
                classes at UCSC for a while.
             </p>
        </div>
    </div>
</template>
