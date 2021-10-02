# PyBook Specification Format

This is the file format for the PyBook scientific notebook. It is designed to be mostly human readable and editable, but also to map exactly to the notebooks in the web interface. 

Things like graphics must be encoded in text format so won't be pretty, but are possible to include. If you don't want output in the saved notebooks, you can remove it before saving notebooks.

## Python source file

In general the saved notebook should be a runnable Python program in the right environment. This means all the "metadata" is designed to be comments in Python. The final filename ends with:
`.pbnb` which stands for PyBook Note Book, somewhat similar to Jupyter's `.ipynb`.

## Cells

Notebooks have at least one cell. Each cell starts with one of the following tags:
    * `#%` for Python code
    * `#%md` for Markdown text

Tags may also include options.

### Python Code options

The `#%` tag for Python code includes the following options:
    * `hidden` means the code is not shown in the interface
    * `eval` means to automatically evaluate on notebook load
    * `hideoutput` means to hide any output

The tags can come in any order, but cannot be repeated.

### Output

After the Python cell contents can come output lines. These are indicated with:
    * `#%out` One line of output on stdout
    * `#%err` One line of output on stderr
    * `#%out<<<` Any amount of output on stdout, ended with `<<<`. The tag can be replaced by any sequence of characters without spaces. Note that newlines in output must start with new comment on next line, which is not interpreted as part of the contents.
    * `#%err<<<` Any amount of output on stderr, ended with `<<<` or other specified tag.
    * `#%content-type: text/html <<<` Any amount of HTML content, ended by `<<<` or other specified tag.

The tags are followed by exactly one character of whitespace. The single line tags are ended by a newline, the multiline forms are ended by the explicit tag followed by a newline. To avoid escaping issues, the start/end tags are customizable. Implementations should choose a sequence of characters that does not appear in the output. Before interpretation, each `\n#` is replaced with `\n` to uncomment the code.

### Markdown

Markdown is normal markdown, within triple quotes. So first line of `'''` and last line of `'''` are ignroed in Markdown rendering. Only small hiccup is that this messes up triple quotes in the Markdown text. The fix is to escape `'''` with `\'''` for every occurrence. Each occurrence of `\'''` will be replaced with `'''` inside the Markdown body before being rendered. For extreme cases of Markdown text discussing the escape mechanism, there may be more than one escape backslash before the triple quotes. Only one level will be removed before interpreting as Markdown.

## Pages

One notebook file can have several pages. Each page is separated with:
    * `#%page` followed by optional space and page name on line

If there is just one page, this tag can be ommitted. If this tag appears first thing in the file, it is assumed to start the first page. This means it is impossible to have a multipage notebook with an entirely blank first page.
