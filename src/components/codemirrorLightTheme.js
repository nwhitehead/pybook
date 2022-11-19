
import { EditorView } from '@codemirror/view';
import { HighlightStyle, syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
import { tags } from '@lezer/highlight';

/*
globalThis.hls = defaultHighlightStyle;
console.log(defaultHighlightStyle);
*/

/**
The highlighting style
*/
//const consoleLightHighlightStyle = HighlightStyle.define(defaultHighlightStyle.specs);


//     [
//     { tag: [tags.meta, tags.comment],
//         color: '#888',
//         fontStyle: 'italic' 
//     },
// ]);

const consoleLightExtension = [syntaxHighlighting(/*consoleLightHighlightStyle*/defaultHighlightStyle)];

export { consoleLightExtension };
