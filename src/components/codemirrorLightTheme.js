
import { EditorView } from '@codemirror/view';
import { HighlightStyle, syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
import { tags } from '@lezer/highlight';

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

const consoleLightExtension = [syntaxHighlighting(consoleLightHighlightStyle)];

export { consoleLightExtension };
