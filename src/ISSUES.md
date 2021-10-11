# Issues

* Focus with hidden cells

When coming out of command mode (green), pressing Enter, if there are hidden cells it focuses the wrong editor.
I think the issue is that hidden cells don't have a codemirror element, selectCell is numeric. Might also be related
to drag and drop, that seems to make problem worse.



