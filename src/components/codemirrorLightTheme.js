
import { EditorView } from '@codemirror/view';
import { HighlightStyle, syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
import { tags } from '@lezer/highlight';

let theme = EditorView.theme({
    "&": {
        fontSize: "14px",
    },
    ".cm-gutters": {
        backgroundColor: "var(--line-gutter)",
        color: "var(--grey)",
        border: "none"
      },
    ".cm-lineNumbers .cm-gutterElement": {
        padding: "0 5px 0 5px",
    },
    ".cm-line": {
        padding: "0 2px 0 6px",
    },
});

/**
The highlighting style
*/
const consoleLightHighlightStyle = HighlightStyle.define(defaultHighlightStyle.specs.concat(
    [
        { tag: [tags.meta, tags.comment],
            color: '#940',
            fontStyle: 'italic' 
        },
    ]
));

const consoleLightExtension = [theme, syntaxHighlighting(consoleLightHighlightStyle)];

export { consoleLightExtension };
