# PyBook

To test:

    python server/serve.py

Then go to http://localhost:8001/src/pybook.html

## Unit Testing

Unit testing requires Jest. Using ES6 modules, so you need a recent node (I have v14.18).

Do:

    npm install jest --global

To run tests in `src/` do:

    NODE_OPTIONS='--experimental-vm-modules' jest

## Demo

    import matplotlib
    matplotlib.use('svg')
    import numpy as np
    import matplotlib.pyplot as plt
    import pybook

    fig, ax = plt.subplots()
    fig.set_size_inches(6, 4)
    ax.plot([1, 2, 3, 4], [1, 4, 2, 3])
    plt.savefig('test.svg')
    with open('test.svg') as f:
        pybook.output_text_content('image/svg+xml', f.read())

## Ideas

### Indicator

Idea is to add execution indicator. Notebook page is linear stack of cells. At start, no cells are evaluated. As you evaluate the cells
in order, the bar goes green down the stack. If you edit a cell that was previously evaluated, you invalidate the green bar and it
resets back to last known state (normally the starting empty state). Three colors: evaluated, evaluating, and unevaluated.

Could indicate "evaluated when saved", but that might be confusing for beginners. If you see an output, it was obviously evaluated
at some point in the past. The "unevaluated" mark is clear, shows that you have not evaluated the cell up to that point in the current
notebook.

This idea is similar to CoqIDE turning colors as you evaluate down the script. There you can stop and go back and forth.

### Checkpoint

It would be nice to not have to evaluate starting from the beginning every time if you edit an old cell. So introduce the idea of
"checkpoints". You can add a "checkpoint" between cells at different points. This mark indicates the editor is keeping a copy of
the state at that point (between cells) in memory. If you invalidate a green bar after the checkpoint, the green is invalidated
back to the checkpoint but no further back. This lets you try alternatives after doing annoying load / preprocess steps.

For implementation, need to expand Pyodide functionality a bit. Normally there is just one interpreter state. That is ok
with checkpoints, need to work on pyexec.run_cell function to allow arbitrary state as input and output.

### Choice point

What about history? Might want to keep previous runs, but also try new things. Enter the idea of "choice point". A choice point
is a checkpoint that contains more than 1 alternate continuation. The alternates are stacks of cells that appear after the choice
point. So a normal checkpoint is a choice point with 1 alternate (the normal cells that come after the checkpoint in the notebook).

Turning a checkpoint into a choice point is an action. The default action is to copy all the cells in the existing notebook after
the choice point into a duplicate alternate. Of course they will be invalidated, evaluation will be at the choice point. Then you
can edit values and re-evaluate to see what happens. Clicking the choice point swaps between all available alternates in the
choice point.

Important point: what happens to choice points below a choice point when a new alternate is added at the top? Some possibilities:

1) The cells below the upper choice point are copied into a new alternate of the upper choice point. Choice points below the upper
choice point are ignored. Cells chosen below the lower choice point are from the currently selected alternate at that point.

2) Cells below the upper choice point are copied into the new alternate of the upper choice point. Choice points below the upper
choice point are copied but flattened to only have one alternate, the currently selected alternate at that point.

3) Everything below the upper choice point is copied into the new alternate of the upper choice point. Choice points and all
alternates are copied into the new alternate of the upper choice point.

Choice (3) is somewhat logical, but leads to an exponential explosion of alternates. It's also not clear if the alternates make
sense once the history getting there is altered. This might be a special command.

Of the shallow copies, I think (2) makes more sense. That keeps the fact there was a checkpoint there, which probably does make
sense. It's easy to delete a choice point, it's harder to add one at the right spot (requires remembering where it was).

Implementing choice points is mostly a UI issue once arbitrary states are supported in interpreter.

### State explorer

In an interpreter the state is normally "hidden" and implicit. With the indicator bar, the steps to get to the current state are visually
indicated. But the state itself could have a window where you can explore values. Just showing a dump is not great. Should ideally
have a "query" that is a custom command that user can set to show values of interest. Can involve code execution (helper functions etc.)
but the results of the query function do not affect the state (original state is unmodified). Default query function dumps local
state using pretty printer.


## Implementation Notes

### General

The interpreter is Pyodide. It runs in a web worker thread, so it can block and do all kinds of Pythonic stuff without interfering with
the browser UI. I had some issues with large module loading, so I hacked dependent module loading and also set the recursion limit
appropriately to make the demos work that I want to work (e.g. numpy and matplotlib import needs deep recursion to work).

The UI is built using VueJS. This is my first VueJS project so organization is ongoing. I tried to split out components in a logical way.

### Checkpoints

Playing around with states. A global state is just a dict. Can duplicate state with `copy.deepcopy`. This seems to work ok.

One fun thing is that you can create your own classes with a `__deepcopy__` method. If that method doesn't actually do the deep copy,
then the state timelines get tangled up and it is pretty confusing. Doesn't seem too bad, if you violate the contract for deep copying
then you get what you deserve.

I think the way to approach multiple states is to keep track of Python global dictionaries. That way there is just one actual Pyodide
interpreter state, and the JS part keeps track of states. The state is passed into the `pbexec.run_cell` function. One interesting thing
is that the `run_cell` doesn't take a state as input and return a new state (functional style), it takes an optional state and then
does the action using that state. Might modify the state, or use it, produce output over time. If the JS part wants to keep around
the original state, needs to duplicate it beforehand and not forget it.

