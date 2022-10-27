window.MathJax = {
    tex: {
        inlineMath: [ ['$','$'], ["\\(","\\)"] ],
        displayMath: [ ['$$','$$'], ["\\[","\\]"] ],
        processEscapes: true,
        processEnvironments: true
    },
    MathML: {
        extensions: ['content-mathml.js']
    },
    displayAlign: 'center',
    "HTML-CSS": {
        availableFonts: [],
        imageFont: null,
        preferredFont: null,
        webFont: "STIX-Web",
        styles: {'.MathJax_Display': {"margin": 0}},
        linebreaks: { automatic: true }
    },
    startup: {
        elements: [] // Do not render entire document by default
    },
};
