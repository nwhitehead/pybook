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

test('parser', () => {
    const tst = '#%% hidden\n# Headline\n#%\nprint(42)\n';
    const res = parse(tst);
    console.log(res);
});