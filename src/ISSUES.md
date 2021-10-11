# Issues

* Focus with hidden cells

When coming out of command mode (green), pressing Enter, if there are hidden cells it focuses the wrong editor.
I think the issue is that hidden cells don't have a codemirror element, selectCell is numeric. Might also be related
to drag and drop, that seems to make problem worse.

* Package dependencies in submit

When doing submit, my idea was to pass text of editor into "submit" function in python. That function can do all
the unit testing, output to output area, needed. Can run the code, or examine it. Problem is that in Pyodide you
need to scan code before executing, and preload packages so they are available to import. Need to call this
explicitly in the submit code, kind of annoying.
