# PyBook Specification Format

This is the file format for the PyBook scientific notebook. It is designed to be mostly human readable and editable, but also to map exactly to the notebooks in the web interface. 

Things like graphics must be encoded in text format so won't be pretty, but are possible to include. If you don't want output in the saved notebooks, you can remove it before saving notebooks.

## Source File

In general the saved notebook will not be a runnable Python program but will be runnable in the PyBook environment.

The final filename ends with `.pbnb` which stands for PyBook Note Book, somewhat similar to Jupyter's `.ipynb`.

## Cells

Notebooks have at least one cell. Each cell starts with one of the following tags:
    * `#%` for Python code
    * `#%%` or `#% md` for Markdown text

You can explicitly end a cell with:
    * `#% end`

Beginning a new cell automatically closes the previous cell. Text outside of cells is ignored. Newlines and spaces at the end of cells is removed.

Tags may also include options, separated by spaces.

### Python Code options

The `#%` tag for Python code includes the following boolean options:
    * `hidden` means the code is not shown in the interface (default is to show code)
    * `auto` means to automatically evaluate on notebook load (default is to not eval on load)
    * `nooutput` means to hide any output (default is to show all output)
    * `readonly` means to make the contents not editable (default is editable)
    * `test` means to ignore cell normally, only use for special testing parse mode
    * `submit` means to make cell a submit cell
    * `user` set the default user text for a submit cell

The tags can come in any order, but cannot be repeated.

Some options have arguments. These are indicated with `id=value` syntax.
    * `id=VALUE` set the unique cell identifier (normally set to fresh integer automatically)
    * `language=LANGUAGE` set the language for submit areas (choices are `python` and `text`)

### Submit cells

To write submit cells with user default text, order this way:
```
#% user language=text
Default user text

#% submit
print(f"You submitted {__input}")
```

If a `user` and `submit` cell are adjacent, they are merged into one submit cell. The `language` of the user part
sets the syntax highlighting. The second `submit` part is always Python code that will evaluate when the "submit"
button is pressed, and will have `__input` bound to the text entered into the cell by the user.

### Markdown options

Default is to show the result of the markdown but no source. Here are the legal options for markdown sections:
    * `edit` means to show the source markdown for editing

## Pages

One notebook file can have several pages. Each page is separated with:
    * `#% page`

If there is just one page, this tag can be ommitted. If this tag appears first thing in the file, it is assumed to start the first page. This means it is impossible to have a multipage notebook with an entirely blank first page.

## Testing

Should be a way to run the entire notebook as a test. Make sure every cell works, answers work.
