#m> # Python Hints
#m>
#m> ## Output
#m>
#m> When you evaluate input, the Python interpreter will evaluate all the expressions in your input. Values that are not `None` will
#m> be shown in the output with an arrow, like this: `→ 4`.
#m>
#m> You can print to `stdout` and `stderr` as well.
#m>

print('🐍' * 10 + ' Hello world!')
import sys
sys.stderr.write('Warning!\n')

#m> ## Input
#m>
#m> When the interpreter is waiting for input, you will see the symbol <span class="material-icons">pending</span>.
#m> You can enter text and press <span class="tag">Enter</span> to submit it.
#m>

name = input('What is your name? ')
print(f'Hello, {name}.')

#m> ## Interrupting
#m> 
#m> While the interpreter is evaluating you will see a busy symbol <span class="material-icons">autorenew</span>.
#m> You can interrupt evaluation with <span class="tag">Ctrl</span>-<span class="tag">C</span>. Try interrupting this program:

while True:
    pass

#m> ## Python Packages
#m> 
#m> Packages provided in the Python standard library can be imported with `import`.
#m> 
#m> For example:

import math

#m> See the list of <a href="https://docs.python.org/3.10/library/">Python packages</a>.

#m> ## Pyodide Packages
#m> 
#m> Packages provided by Pyodide can be imported with `import`.
#m> 
#m> For example:

import numpy

#m> See the list of <a href="https://pyodide.org/en/stable/usage/packages-in-pyodide.html">supported packages</a>.
#m>
#m> ## Pure Python Packages
#m> 
#m> Packages available on PyPI that are pure Python can be installed automatically with `import`.
#m> 
#m> For example:

import hypothesis

#m> See the projects on <a href="https://pypi.org/">https://pypi.org/</a>. Due to browser limitations not all packages
#m> are supported directly.

#m> ## Debugging
#m> 
#m> Simple interactive debugging can be done using `pdb`. Within your code, set breakpoints by
#m> calling `breakpoint()`. When your code hits a breakpoint the interactive debugger will be started.
#m> You can examine state, continue execution, or quit.

def factorial(n):
    breakpoint()
    return n * factorial(n - 1)

factorial(2)

#m> To debug the example, try entering `c` four times when the interactive debugger starts.
#m> Then try `p n` to see the value of `n`. Try `bt` to get a backtrace. Enter `q` to quit.
#m> 
#m> What's wrong with the function?

#m> ## Rich Output (HTML)
#m> 
#m> Using the `pybook` package you can output sanitized HTML. Here is an example showing an
#m> icon from Google Material Icons (which are used on the website so are already loaded).

import pybook
pybook.output_content('text/html', '<span class="material-icons">sailing</span>')

#m> Allowed content types include `text/plain`, `text/html`, `image/png`, `image/svg+xml`, and `audio/wav`. HTML output
#m> is sanitized through <a href="https://github.com/cure53/DOMPurify">DOMPurify</a>
#m> which only allows a subset of content. The `pybook` package is specific to _Nathan's Python Console_ tools.

#m> ## matplotlib graphs
#m> 
#m> You can use `matplotlib` to generate and show graphs. There are several important steps. First, choose a non-interactive backend that allows
#m> generating PNG or SVG images. For PNG generation you can use the `agg` backend like this:

import matplotlib
matplotlib.use('agg')

#m> Next, after creating a plot use the `savefig()` method to save the plot. Here is an example:

import matplotlib
matplotlib.use('agg')

import matplotlib.pyplot as plt
plt.style.use('ggplot')
plt.plot([1, 3, 2, 4])
plt.ylabel('some numbers')
plt.savefig('plot.png')
plt.clf()

#m> Finally, output the PNG file to the browser. (Below snippet assumes you have saved the file already).

import pybook
pybook.output_file('image/png', 'plot.png')

#m> Here it is all together:

import matplotlib
matplotlib.use('agg')

import matplotlib.pyplot as plt
plt.style.use('ggplot')
plt.plot([1, 3, 2, 4])
plt.ylabel('some numbers')
plt.savefig('plot.png')
plt.clf()

import pybook
pybook.output_file('image/png', 'plot.png')

#m> Here is a similar example generating a vector SVG graph using the `svg` backend. This example also sets dark mode for the generated output.

import matplotlib
matplotlib.use('svg')

import matplotlib.pyplot as plt
plt.style.use('dark_background')
plt.plot([1, 3, 2, 4])
plt.ylabel('some numbers')
plt.savefig('plot.svg')
plt.clf()

import pybook
pybook.output_file('image/svg+xml', 'plot.svg')

#m> ## Images
#m> 
#m> Here is an example showing generation and display of a PNG image.

import png

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
pybook.output_file('image/png', 'test.png')

#m> ## Audio
#m>
#m> Here is an example showing generation and output of an audio clip.

import wave
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


#m> ## Copy and Paste
#m> 
#m> The console and code editor support multiline editing. You can copy larger fragments from other sources and paste in the code, then edit and evaluate them.
#m>
#m> One small note is that if you are trying to copy and paste within the input area, the binding for <span class="tag">Ctrl</span>-<span class="tag">C</span>
#m> is to interrupt the interpreter. You may be able to use a right click to copy in this case. You can also set a configuration option to use
#m> <span class="tag">Ctrl</span>-<span class="tag">I</span> to interrupt the interpreter and leave the standard binding for
#m> <span class="tag">Ctrl</span>-<span class="tag">C</span>.

#m> ## Files
#m> 
#m> You can use regular file operations from Python in the console. The filesystem is a temporary filesystem kept in memory and only
#m> persists as long as the interpreter is running. Restarting the interpreter will lose any changes to the filesystem.
#m> 
#m> If you want to persist files between page loads you can put files in the `persistent` directory. The contents of the `persistent`
#m> directory are stored in the browsers local storage area. Don't forget that if you visit from another computer the file contents will <em>not</em>
#m> be visible.
#m> 
#m> Another option is to download files generated by Python to the local system. You can use `pybook` to show a download link, then click the
#m> link to save your file. Here is an example with a PNG file:

import png

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
pybook.download_file('test.png')

#m> To work on saved files, you can use `pybook` to show an upload link. Click the link and
#m> choose the file to upload. Once the contents are uploaded, the Python program continues. Files up to 16 MB are allowed.

import pybook
import os

pybook.upload_file('test.png')
# Let's see how long the file is
f = open('test.png', 'rb')
f.seek(0, os.SEEK_END)
print(f.tell())

#m> ## PyPI packages with `micropip`
#m> 
#m> If you have turned off automatic package install from PyPI, or in case the `import` statement cannot be mapped to a specific PyPI package,
#m> you can directly import PyPI packages using `micropip`. Here is an example:

import micropip
await micropip.install('hypothesis')
import hypothesis

#m> ## Async IO
#m> 
#m> There is some support for asynchronous IO in the console. In particular, top-level `await` is allowed. The module `asyncio`
#m> can be imported and used. Note that the browser already has a top-level event loop running. You cannot start a new top-level event loop using `asyncio`.
#m> This means some examples may need to be edited for the browser.

import asyncio

async def foo():
    print('hello')
    await asyncio.sleep(1)
    print('world')

await(foo())

#m> ## Tracing program flow
#m> 
#m> To debug small Python programs it can be convenient to use <a href="">`snoop`</a>. This package lets you decorate a function and it will
#m> show debug output for each line of the function as it executes. Here is an example:

import snoop

@snoop
def f():
    i = 0 
    while True:
        print(f'count {i}')
        i += 1

f()

#m> To help with legibility you can choose different output locations and color schemes. Here is an example with fewer colors:

import snoop
import sys

snoop.install(color='bw')
@snoop
def f():
    i = 0
    while True:
        print(f'count {i}')
        i += 1

f()
