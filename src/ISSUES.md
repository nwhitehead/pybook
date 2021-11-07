# Issues

## Checkpoint (states)

Big problem with duplicating existing states with deepcopy is that it doesn't work for imported modules. So if you
do any `import ...` at all it will fail. It makes some sense to fail if there are open files or other objects that
don't support deepcopy, but there has to be a way to make it work with modules. Looking at `dill` for inspiration.

## Pyodide CDN setInterruptBuffer missing

When I try to use the Pyodide CDN at: https://cdn.jsdelivr.net/pyodide/v0.18.1 I can't get `setInterruptBuffer` to work.
Seems to affect v0.18.0, v0.18.1, v0.18.2.
UPDATE: Fixed in v0.19, but this one is not yet tagged with versions on the CDN.

## Focus with hidden cells

When coming out of command mode (green), pressing Enter, if there are hidden cells it focuses the wrong editor.
I think the issue is that hidden cells don't have a codemirror element, selectCell is numeric. Might also be related
to drag and drop, that seems to make problem worse.

## Package dependencies in submit

When doing submit, my idea was to pass text of editor into "submit" function in python. That function can do all
the unit testing, output to output area, needed. Can run the code, or examine it. Problem is that in Pyodide you
need to scan code before executing, and preload packages so they are available to import. Need to call this
explicitly in the submit code, kind of annoying.

## Submit

Renamed `exec` package to `pbexec` since there is a builtin `exec` function that submit might need. Had some issues
with evaluation breaking entirely when I tried to do the following cell:

    # hello
    # this is `tt` text

    def main():
    ''' Docstring '''
    print("42")
    print('what')

    main()
    print(exec)
    import pbexec
    print(pbexec)
    print(pbexec.wrapped_run_cell)
    pbexec.wrapped_run_cell('print("42")')

    import sys
    print(sys.version)

    def submit(txt):
    print('submit from python')

    x = 5
