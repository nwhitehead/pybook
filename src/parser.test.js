import { parseSpecialDelimiterLine,
         parse } from './parser.js';

test('parseSpecialDelimiterLine1', () => {
    expect(parseSpecialDelimiterLine('#%%')).toStrictEqual(
        { 'type': 'Markdown', options: []});
    expect(parseSpecialDelimiterLine('#%')).toStrictEqual(
        { 'type': 'Code', options: []});
    expect(() => parseSpecialDelimiterLine('#%md')).toThrow('Unknown delimiter');
    expect(parseSpecialDelimiterLine('#% noexec')).toStrictEqual(
        { 'type': 'Code', options: ['noexec']});
    expect(parseSpecialDelimiterLine('#% hidden noexec')).toStrictEqual(
        { 'type': 'Code', options: ['hidden', 'noexec']});
});

test('parser1', () => {
    const tst = '#%% hidden\n# Headline\n#%\nprint(42)\n';
    const res = parse(tst);
    expect(res.length).toBe(1);
    expect(res[0].length).toBe(2);
    expect(res[0][0].type).toBe('Markdown');
    expect(res[0][0].options).toStrictEqual(['hidden']);
    expect(res[0][1].type).toBe('Code');
    expect(res[0][1].options).toStrictEqual([]);
});
