//!
//! MainView
//!
//! A Vue component representing the main landing page of site
//!

<template>
    <div class="container">
        <div class="content">
            <p class="subtitle is-4">Python Hints</p>

<p class="subtitle is-5">Output</p>
<p>When you evaluate input, the Python interpreter will evaluate all the expressions in your input. Values that are not <tt>None</tt> will
be shown in the output with an arrow, like this: <tt>→ 4</tt>.</p>
<p>You can print to <tt>stdout</tt> and <tt>stderr</tt> as well.</p>
<Example :code="String.raw`4
print('🐍' * 10 + ' Hello world!')
import sys
sys.stderr.write('Warning!\n')`" />

<p class="subtitle is-5">Input</p>
<p>When the interpreter is waiting for input, you will see the symbol <span class="material-icons">pending</span>.
You can enter text and press <span class="tag">Enter</span> to submit it.</p>
<Example :code="String.raw`name = input('What is your name? ')
print(f'Hello, {name}.')`" />

<p class="subtitle is-5">Interrupting</p>
<p>While the interpreter is evaluating you will see a busy symbol <span class="material-icons">autorenew</span>.
You can interrupt evaluation with <span class="tag">Ctrl</span>-<span class="tag">C</span>. Try interrupting this program:</p>
<Example :code="String.raw`while True:
    pass`" />

<p class="subtitle is-5">Python Packages</p>
<p>Packages provided in the Python standard library can be imported with <tt>import</tt>.</p>
<p>For example:</p>
<Example :code="String.raw`import math`" />
<p>See the list of <a href="https://docs.python.org/3.10/library/">Python packages</a>.</p>

<p class="subtitle is-5">Pyodide Packages</p>
<p>Packages provided by Pyodide can be imported with <tt>import</tt>.</p>
<p>For example:</p>
<Example :code="String.raw`import numpy`" />
<p>See the list of <a href="https://pyodide.org/en/stable/usage/packages-in-pyodide.html">supported packages</a>.</p>

<p class="subtitle is-5">Pure Python Packages</p>
<p>Packages available on PyPI that are pure Python can be installed automatically with <tt>import</tt>.</p>
<p>For example:</p>
<Example :code="String.raw`import hypothesis`" />
<p>See the projects on <a href="https://pypi.org/">https://pypi.org/</a>. Due to browser limitations not all packages
are supported directly.</p>

<p class="subtitle is-5">Debugging</p>
<p>Simple interactive debugging can be done using <tt>pdb</tt>. Within your code, set breakpoints by
calling <tt>breakpoint()</tt>. When your code hits a breakpoint the interactive debugger will be started.
You can examine state, continue execution, or quit.</p>
<Example :code="String.raw`def factorial(n):
    breakpoint()
    return n * factorial(n - 1)

factorial(2)`" />
<p>To debug the example, try entering <tt>c</tt> four times when the interactive debugger starts.
Then try <tt>p n</tt> to see the value of <tt>n</tt>. Try <tt>bt</tt> to get a backtrace. Enter <tt>q</tt> to quit.
What's wrong with the function?</p>

<p class="subtitle is-5">Rich Output (HTML)</p>
<p>Using the <tt>pybook</tt> package you can output sanitized HTML. Here is an example showing an
icon from Google Material Icons.</p>

<Example :code="sailingExample" />

<p>Allowed content types include <tt>text/plain</tt>, <tt>text/html</tt>, <tt>image/png</tt>, <tt>image/svg+xml</tt>, and <tt>audio/wav</tt>. HTML output
is sanitized through <a href="https://github.com/cure53/DOMPurify">DOMPurify</a>
which only allows a subset of content. The <tt>pybook</tt> package is specific to <emph>Nathan's Python Console</emph> tools.</p>

<p class="subtitle is-5"><tt>matplotlib</tt> graphs</p>

<p>You can use <tt>matplotlib</tt> to generate and show graphs. There are several important steps. First, choose a non-interactive backend that allows
generating PNG or SVG images. For PNG generation you can use the <tt>agg</tt> backend like this:</p>

<Example :code="String.raw`import matplotlib
matplotlib.use('agg')
`" />

<p>Next, after creating a plot use the <tt>savefig()</tt> method to save the plot. Here is an example:</p>

<Example :code="String.raw`import matplotlib
matplotlib.use('agg')

import matplotlib.pyplot as plt
plt.style.use('fivethirtyeight')
plt.plot([1, 3, 2, 4])
plt.ylabel('some numbers')
plt.savefig('plot.png')
plt.clf()
`" />

<p>Finally, output the PNG file to the browser.</p>

<Example :disabled="true" :code="String.raw`import pybook
pybook.output_file('image/png', 'plot.png')
`" />

<p>Here it is all together:</p>

<Example :code="String.raw`import matplotlib
matplotlib.use('agg')

import matplotlib.pyplot as plt
plt.style.use('fivethirtyeight')
plt.plot([1, 3, 2, 4])
plt.ylabel('some numbers')
plt.savefig('plot.png')
plt.clf()

import pybook
pybook.output_file('image/png', 'plot.png')
`" />


<p>Here is a similar example generating a vector SVG graph using the <tt>svg</tt> backend. This example also sets dark mode for the generated output.</p>

<Example :code="String.raw`import matplotlib
matplotlib.use('svg')

import matplotlib.pyplot as plt
plt.style.use('dark_background')
plt.plot([1, 3, 2, 4])
plt.ylabel('some numbers')
plt.savefig('plot.svg')
plt.clf()

import pybook
pybook.output_file('image/svg+xml', 'plot.svg')
`" />

<p class="subtitle is-5">Images</p>

<p>Here is an example showing generation and display of a PNG image.</p>

<Example :code="String.raw`import png

width = 100
height = 100
img = []
for y in range(height):
    row = ()
    for x in range(width):
        row = row + (200 - (x + y), x*2, y*2)
    img.append(row)
with open('test.png', 'wb') as f:
    w = png.Writer(width, height, greyscale=False)
    w.write(f, img)

import pybook
pybook.output_file('image/png', 'test.png')`" />

<p class="subtitle is-5">Audio</p>

<p>Here is example showing generation and output of an audio clip.</p>
<Example :code="String.raw`import wave
import struct
import math

sampleRate = 44100.0 # hertz
duration = 4.0 # seconds
frequency = 120.0 # hertz
phase_delta = 1.0 / sampleRate * frequency * math.tau
phase = 0.0
feedback = 0.8
N = int(sampleRate * duration)
obj = wave.open('sound.wav','wb')
obj.setnchannels(1) # mono
obj.setsampwidth(2)
obj.setframerate(sampleRate)
output = 0
for i in range(N):
    phase += phase_delta
    ramp = (N - i) / N
    output = math.sin(phase + 10 * ramp * math.sin(phase) + ramp * feedback * output)
    obj.writeframesraw(struct.pack('&lt;h', int(output * 32767.0)))
obj.close()

import pybook
data = open('sound.wav', 'rb').read()
pybook.output_content('audio/wav', data)
`" />

<p class="subtitle is-5">Copy and Paste</p>

<p>The console and code editor support multiline editing. You can copy larger fragments from other sources and paste in the code, then edit and evaluate them.</p>
<p>One small note is that if you are trying to copy and paste within the input area, the binding for <span class="tag">Ctrl</span>-<span class="tag">C</span>
is to interrupt the interpreter. You may be able to use a right click to copy in this case. You can also set a configuration option to use
<span class="tag">Ctrl</span>-<span class="tag">I</span> to interrupt the interpreter and leave the standard binding for
<span class="tag">Ctrl</span>-<span class="tag">C</span>.</p>

<p class="subtitle is-5">Files</p>

<p>You can use regular file operations from Python in the console. The filesystem is a temporary filesystem kept in memory and only
persists as long as the interpreter is running. Restarting the interpreter will lose any changes to the filesystem.</p>

<p>If you want to persist files between page loads you can put files in the <tt>persistent</tt> directory. The contents of the <tt>persistent</tt>
directory are stored in the browsers local storage area. Don't forget that if you visit from another computer the file contents will <em>not</em>
be visible.</p>

<p>Another option is to download files generated by Python to the local system. You can use <tt>pybook</tt> to show a download link, then click the
link to save your file. Here is an example with a PNG file:</p>

<Example :code="String.raw`import png

width = 100
height = 100
img = []
for y in range(height):
    row = ()
    for x in range(width):
        row = row + (200 - (x + y), x*2, y*2)
    img.append(row)
with open('test.png', 'wb') as f:
    w = png.Writer(width, height, greyscale=False)
    w.write(f, img)

import pybook
pybook.download_file('test.png')`" />

<p>To work on saved files, you can use <tt>pybook</tt> to show an upload link. Click the link and
choose the file to upload. Once the contents are uploaded, the Python program continues. Files up to 16 MB are allowed.</p>

<Example :code="String.raw`import pybook
import os

pybook.upload_file('test.png')
# Let's see how long the file is
f = open('test.png', 'rb')
f.seek(0, os.SEEK_END)
print(f.tell())
`" />

<p class="subtitle is-5">PyPI packages with <tt>micropip</tt></p>

<p>In case the <tt>import</tt> statement cannot be mapped to a specific PyPI package, you can directly import PyPI packages using
<tt>micropip</tt>. Here is a hypothetical example:</p>

<Example :code="String.raw`import micropip
await micropip.install('hypothesis')
import hypothesis
`" />

<p class="subtitle is-5">Async IO</p>

<p>There is some support for asynchronous IO in the console. In particular, top-level <tt>await</tt> is allowed. The module <tt>asyncio</tt>
can be imported and used. Note that the browser has a top-level event loop running. You cannot start a new top-level event loop using <tt>asyncio</tt>.
This means some examples may need to be edited for the browser.</p>

<p class="subtitle is-5">Tracing program flow</p>

<p>To debug small Python programs it can be convenient to use <a href=""><tt>snoop</tt></a>. This package lets you decorate a function and it will
show debug output for each line of the function as it executes. Here is an example:</p>

<Example :code="String.raw`import snoop

@snoop
def f():
    i = 0 
    while True:
        print(f'count {i}')
        i += 1

f()
`" />

<p>To help with legibility you can choose different output locations and color schemes. Here is an example with options set:</p>

<Example :code="String.raw`import snoop
import sys

snoop.install(out=sys.stdout, color='bw')
@snoop
def f():
    i = 0
    while True:
        print(f'count {i}')
        i += 1

f()
`" />

        </div>
    </div>
</template>

<script setup>

import Example from '../Example.vue';

// This one is annoying to escape
const sailingExample = `import pybook
pybook.output_content('text/html', '<span class="material-icons">sailing</span>')`;

</script>
