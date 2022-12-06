# Notes

These are some notes about PythonConsole.com.

I bought the domain from namecheap.com. I thought about using pybook.ml from FreeNom but
that seemed a bit sketchy.

Hosting is Vultr VPS. The ansible playbook commands work to keep it setup and up to date.

Domain email is handled through an add-on with namecheap, goes through privateemail.com.

Signups are handled with MailJet.

## Ideas

These are some unorganized ideas for Python notebooks.

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

For implementation, states are kept at Python dictionaries and passed as the globals/locals arguments to the exec commands used
when evaluating cells. The main difficulty is that states often need to be duplicated to support changing them and keeping a copy of
the original state. This requires care since the main Python globals dictionary has all types of objects that may or may not support
copying.

### Using checkpoints

Cells can be "checkpoints" with a name, and then either a "save" or a "use" of that checkpoint. The idea is that you do a bunch of
commands, then do a "save" checkpoint. Then you can "use" that checkpoint again and again. You can also "use" the old checkpoint,
do some commands, then "save" a new checkpoint.

By default, each page of a notebook is a fresh state. That makes the most sense to me since visually each page starts at the top and
you can't see what was on earlier pages. If you want to keep state between pages, you do a "save" checkpoint at the end of page and
then a "use" checkpoint at the start of new pages. This allows things like setting up support functions and tests, then reusing
them for different problems without too much interference between exercises.

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

### Checkpoints

Playing around with states. A global state is just a dict. Can duplicate state with `copy.deepcopy`. This seems to work ok.

One fun thing is that you can create your own classes with a `__deepcopy__` method. If that method doesn't actually do the deep copy,
then the state timelines get tangled up and it is pretty confusing. Doesn't seem too bad, if you violate the contract for deep copying
then you get what you deserve.

I think the way to approach multiple states is to keep track of Python global dictionaries. That way there is just one actual Pyodide
interpreter state, and the JS part keeps track of states. The state is passed into the `pbexec.run_cell` function. One interesting thing
is that the `run_cell` doesn't take a state as input and return a new state (functional style), it takes an optional state and then
does the action using that state. Might modify the state, or use it, produce output over time. If the JS part wants to keep around
the original state, needs to duplicate it beforehand and not forget it. Duplicating state has some quirks but seems to work after
patching up corner cases like modules types, file objects, and JS proxy objects.

### Invalidation

How does evaluation work with consistent state display?

Notebook is array of cells, subdivided into pages. Cells can optionally be "checkpoints" with a name. A checkpoint is either a "Save"
or a "Use" point. The "Use" points must refer to the name of a previous "Save" point.

Does encountering an error stop evaluation? I can see good arguments for yes and no. I personally would like it to continue, since I often
demonstrate exceptions as functionality. But often any problem would indicate to stop. `KeyboardInterrupt` should stop evaluation of the particular
cell, and stop all cells evaluating that come after.

Some actions to consider:
* Add save checkpoint before this cell
* Add save checkpoint after this cell
* Flip checkpoint between "Save" to "Use"
* Select checkpoint to "Use"
* Rename "Save" checkpoint
* Evaluate through current cell and keep cursor on current cell
* Evaluate through current cell and advance cursor to next cell
* Modify text of cell that has not been evaluated
* Modify text of cell that has been previously evaluated
* Perform movement operation / reordering of cells that have been evaluated

We can check consistent of a state with current displayed notebook by looking at evaluated / non-evaluated tags and match against history
in the state. Not sure what to do if there are inconsistencies, I guess show an internal error (more useful for debugging pybook).
Another function can check state consistency, if it doesn't match then invalidate cells until we have a state that matches, perhaps
back to the beginning.

Always assume first cell has a "Save start" checkpoint at the start.

To evaluate random cell: can always insert "From start" before it and then do full eval on the cell. To do that for "current" state, maybe
keep inserting new cell at position of last eval? But with checkpoints there might be many "last positions" on the same page even.

New pages could start with default "From start" at the top (can be changed). That might make reasoning about the code you are looking at easier.

### Eval

Every cell has the "evaluated" mark, but internally we also need to keep track of which state was used. Evaluating a "Use State 1" checkpoint
duplicates "State 1" into a fresh name "fresh". The fresh name is then memoed in the checkpoint cell. The next cell that is unevaluated but wants to
eval, looks as the previous cell and sees that it was evaluated and has a state name "fresh". Using that state we can eval the cell and memo it
as evaluated by "fresh".

Then when we hit a "Save State 1" we can duplicate "fresh" into "State 1" directly. We then mark the "Save State 1" cell as being evaluated by "fresh".
This leaves "State 1" as something we can duplicate later in a "Use State 1" without messing it up. We keep going to the next cell, evaluating with "fresh".

Conclusion: we need rules for invalidating cells based on edits. Need to keep track of which state evaluated the cell. Can do a sanity pass to go through
all cells and track which ones were marked as being evaluated by X, then look at history in X to see it matches the code in all the cells.

Also need to be careful about deleting unused states after edits.

Maybe also need to store in state some type of hash of the cell that was last evaluated. Then we can look at the state we are about to use, and look
at the previous cell that supposedly was evaluated most recently, and verify that the hash of that cell is indeed the one in the state. Hash could
include source and cell position in notebook.

For keeping things consistent, we can keep an array of commands used for each state. Then we can look through the notebook to find all "save" checkpoints
and all live ends of evaluations, and double check that the actual Python state history there matches the recorded array of commands that is
supposed to have been used.

### Chaining

Each cell has "evalstate" which can be "" (unevaluated), "working", or "evaluated".

## Student Thoughts

Some features useful for interactive tutorials and quizzes:
* Hidden cells with python code that runs before any commands to evaluate anything
* Code cells with default starting text, that are expected to be run as "submitting answer". Clicking submit runs custom code (which may evaluate answer).
* Pages of notebook can be individual "problems" with explanation and questions. Nice to have some sort of "scoring" between pages outside of eval state.
* Nice to have notebook pages that are skipped by default, but can be shown if requested by clicking on button for help.

# Rust Server

To make notebooks useful, there needs to be a backend server. I tried to work on some audio demos. If every change is auto-saved to a file on disk,
it is annoying to not have a "canonical" version. If changes are not saved, I lose work. I have to copy changes to the source file in a separate
editor, loses the "experimental" nature of notebooks.

What is really needed is a version controlled backend. You click a notebook, it shows it. You make local changes, they are saved permanently but
are not tagged as the canonical version of the notebook. When you load you can click the canonical version, or old versions, or the latest version.

After thinking about versioning and files, I think the right solution is to:
* Keep a hash of notebook text files (source of truth)
* Database keeps track of users, documents, and the array of hashes for versions of the document (with timestamps, audits of who has access to change etc.)
* A separate service maps hash values to contents for publishing the notebook
* Content server has public instance and logged in instance. Public instance for published notebooks, logged in instance requires login and checks permissions.

The separate hash service allows serving published notebooks, even if there are problems with user authentication or the database server is down or whatever.
The content server can be agressively cached, sharded, etc. to deal with web traffic.

For initial implementation, there is just one rust program that does all serving. Use single file sqlite database for keeping track of users,
hashes of content, history of hashes for reversions, permissions. Actual files for content, with filenames based on hashes.

# What I'm Working On

Getting linear evaluation working.

Rust server for CRUD and versioning of notebook data.
