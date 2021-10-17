import { parseSpecialDelimiterLine,
         parse,
         unparse } from './parser.js';

test('parseSpecialDelimiterLine1', () => {
    expect(parseSpecialDelimiterLine('#%%')).toStrictEqual(
        { 'type': 'markdown', options: []});
    expect(parseSpecialDelimiterLine('#%')).toStrictEqual(
        { 'type': 'code', options: []});
    expect(() => parseSpecialDelimiterLine('#%md')).toThrow('Unknown delimiter');
    expect(parseSpecialDelimiterLine('#% noexec')).toStrictEqual(
        { 'type': 'code', options: ['noexec']});
    expect(parseSpecialDelimiterLine('#% md')).toStrictEqual(
        { 'type': 'markdown', options: []});
    expect(parseSpecialDelimiterLine('#% hidden noexec')).toStrictEqual(
        { 'type': 'code', options: ['hidden', 'noexec']});
});

test('parser1', () => {
    const tst = `#%% hidden
# Headline
#%
print(42)
`;
    const res = parse(tst);
    expect(res.length).toBe(1);
    expect(res[0].length).toBe(2);
    expect(res[0][0].cell_type).toBe('markdown');
    expect(res[0][0].metadata).toStrictEqual({hidden:true, subtype:'view'});
    expect(res[0][0].source).toBe('# Headline\n');
    expect(res[0][1].cell_type).toBe('code');
    expect(res[0][1].metadata).toStrictEqual({});
    expect(res[0][1].source).toBe('print(42)\n');
    expect(unparse(parse(tst))).toBe(tst);
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
    const res = parse(tst);
    expect(res.length).toBe(2);
    expect(res[0].length).toBe(2);
    expect(res[0][0].cell_type).toBe('markdown');
    expect(res[0][0].metadata).toStrictEqual({subtype:'view'});
    expect(res[0][0].source).toBe('# Title\nmore\n');
    expect(res[0][1].cell_type).toBe('code');
    expect(res[0][1].metadata).toStrictEqual({startup:true});
    expect(res[0][1].source).toBe('print(42)\n');
    expect(res[1].length).toBe(2);
    expect(res[1][0].cell_type).toBe('markdown');
    expect(res[1][0].metadata).toStrictEqual({subtype:'view'});
    expect(res[1][0].source).toBe('hello\n');
    expect(res[1][1].cell_type).toBe('code');
    expect(res[1][1].metadata).toStrictEqual({submit:true});
    expect(res[1][1].source).toBe('# hi\n');
    expect(parse(unparse(parse(tst)))).toStrictEqual(parse(tst));
});
