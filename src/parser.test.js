import { splitByLines,
         parseSpecialDelimiterLine,
         parsePrefix,
         parsePages,
         parse,
         unparse } from './parser.js';

test('splitByLines', () => {
    expect(splitByLines('abc\ndef\n')).toStrictEqual(
        ['abc', 'def']);
    expect(splitByLines('abc\ndef')).toStrictEqual(
        ['abc', 'def']);
    expect(splitByLines('abc')).toStrictEqual(
        ['abc']);
});

test('parseSpecialDelimiterLine', () => {
    expect(parseSpecialDelimiterLine('#---#')).toStrictEqual('cell');
    expect(parseSpecialDelimiterLine('#---page---#')).toStrictEqual('page');
    expect(parseSpecialDelimiterLine('# Title')).toStrictEqual(null);
    expect(parseSpecialDelimiterLine('')).toStrictEqual(null);
});

test('parsePrefix', () => {
    expect(parsePrefix('#m> # Title')).toStrictEqual([ 'markdown', '# Title']);
    expect(parsePrefix('#m Blah')).toStrictEqual([ 'python', '#m Blah']);
    expect(parsePrefix('import numpy as np')).toStrictEqual([ 'python', 'import numpy as np']);
    expect(parsePrefix('')).toStrictEqual([ 'python', '']);
    expect(parsePrefix('# Test')).toStrictEqual([ 'python', '# Test']);
    expect(parsePrefix('#m> ')).toStrictEqual([ 'markdown', '']);
});

test('parser1', () => {
    const tst = '#m> # Headline\nprint(42)\n';
    expect(parse(tst)).toStrictEqual(
        [[
            {
                'cell_type': 'markdown',
                'source': '# Headline',
                'options': {},
            },
            {
                'cell_type': 'python',
                'source': 'print(42)',
                'options': {},
            },
        ]]
    );
     expect(unparse(parse(tst))).toStrictEqual(tst); // This only works because there is no eliminated newlines
     expect(parse(unparse(parse(tst)))).toStrictEqual(parse(tst));
});

test('parser2', () => {
    const tst = `#m> # Title
#m> more

# This is python
print(42)
x = 5

#m> What is going on here?
#m> * Asterisk

y = 3

#---#

x = 1
`;
    expect(parsePages(tst)).toStrictEqual(
    [
        [
            {
                'cell_type': 'markdown',
                'source': '# Title\nmore',
                'options': {},
            },
            {
                'cell_type': 'python',
                'source': '# This is python\nprint(42)\nx = 5',
                'options': {},
            },
            {
                'cell_type': 'markdown',
                'source': 'What is going on here?\n* Asterisk',
                'options': {},
            },
            {
                'cell_type': 'python',
                'source': 'y = 3',
                'options': {},
            },
            {
                'cell_type': 'python',
                'source': 'x = 1',
                'options': {},
            },
        ]
    ]);
     expect(parse(unparse(parse(tst)))).toStrictEqual(parse(tst));
});
