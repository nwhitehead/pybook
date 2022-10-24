import { splitByLines,
         isSpecialDelimiter,
         parseSpecialDelimiterLine,
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

test('isSpecialDelimiter', () => {
    expect(isSpecialDelimiter('#%'));
    expect(isSpecialDelimiter('#% markdown\n'));
    expect(!isSpecialDelimiter(''));
    expect(!isSpecialDelimiter('#'));
    expect(!isSpecialDelimiter('%#'));
});

test('parseSpecialDelimiterLine1', () => {
    expect(parseSpecialDelimiterLine('#%%')).toStrictEqual(
        { 'type': 'markdown', options: []});
    expect(parseSpecialDelimiterLine('#%')).toStrictEqual(
        { 'type': 'code', options: []});
    expect(() => parseSpecialDelimiterLine('#%md')).toThrow('Unknown delimiter');
    expect(parseSpecialDelimiterLine('#% auto')).toStrictEqual(
        { 'type': 'code', options: ['auto']});
    expect(parseSpecialDelimiterLine('#% md')).toStrictEqual(
        { 'type': 'markdown', options: []});
    expect(parseSpecialDelimiterLine('#% hidden auto')).toStrictEqual(
        { 'type': 'code', options: ['hidden', 'auto']});
    expect(() => parseSpecialDelimiterLine('#% fulloutput')).toThrow('Illegal option fulloutput');
    expect(() => parseSpecialDelimiterLine('#% abc=def')).toThrow('Illegal key option abc=def');
    expect(parseSpecialDelimiterLine('#% id=1234')).toStrictEqual(
        { 'type': 'code', options: ['id=1234' ]});
});

test('parser1', () => {
    const tst = `#%% hidden
# Headline
#%
print(42)
`;
    const res = parsePages(tst);
    expect(parsePages(tst)).toStrictEqual(
        [[
            {
                'id': 1,
                'cell_type': 'markdown',
                'hidden': true,
                'subtype': 'view',
                'source': '# Headline',
                'outputs': [],
            },
            {
                'id': 2,
                'cell_type': 'code',
                'source': 'print(42)',
                'outputs': [],
            },
        ]]
    );
    expect(unparse(parse(tst))).toStrictEqual(tst);
    expect(parse(unparse(parse(tst)))).toStrictEqual(parse(tst));
});

test('parser2', () => {
    const tst = `
#% md
# Title
more
#% end


#% startup
print(42)
#% end

#% page
#%%
hello
#% submit
# hi
`;
    expect(parsePages(tst)).toStrictEqual(
    [
        [
            {
                'id': 1,
                'cell_type': 'markdown',
                'subtype': 'view',
                'source': '# Title\nmore',
                'outputs': [],
            },
            {
                'id': 2,
                'cell_type': 'code',
                'startup': true,
                'source': 'print(42)',
                'outputs': [],
            },
        ], [
            {
                'id': 3,
                'cell_type': 'markdown',
                'subtype': 'view',
                'source': 'hello',
                'outputs': [],
            },
            {
                'id': 4,
                'cell_type': 'submit',
                'source': '# hi',
                'user': '',
                'outputs': [],
            },
        ]
    ]);
    expect(parse(unparse(parse(tst)))).toStrictEqual(parse(tst));
});
