'''
Parse PBNB format files

Specification described in FileSpec.md

'''
import pytest

def split_by_lines(txt):
    ''' Split a long text string into array of lines '''
    # Remove single trailing newline if exists
    if len(txt) > 0 and txt[-1] == '\n':
        txt = txt[:-1]
    return txt.split('\n');

def test_split_by_lines():
    assert split_by_lines('abc\ndef\n') == ['abc', 'def']
    assert split_by_lines('abc\ndef') == ['abc', 'def']
    assert split_by_lines('abc') == ['abc']

def is_special_delimiter(txt):
    ''' Determine if a line starts with special "#%" marks '''
    if len(txt) < 2:
        return False
    return txt[0:2] == '#%'

def test_is_special_delimiter():
    assert is_special_delimiter(r'#%')
    assert is_special_delimiter(r'#% markdown\n')
    assert not is_special_delimiter('')
    assert not is_special_delimiter('#')
    assert not is_special_delimiter(r'%#')

def parse_special_delimiter_line(txt):
    ''' Parse a line that is special, return object with info, throws if delim not legal '''
    if not is_special_delimiter(txt):
        return None
    parts = txt.split(' ')
    # Remove empty parts from multiple spaces in a row
    parts = [ item for item in parts if item != '']
    options = parts[1:]
    delim = parts[0]
    line_type = ''
    # Match delim against fixed set of allowed possibilities
    matches = {
        r'#%': 'code',
        r'#%%': 'markdown',
    }
    if delim in matches:
        line_type = matches[delim]
    else:
        raise Exception('Unknown delimiter')
    # Now handle options changing the type
    # This dictionary has key of option text that appears, value is what to make the type
    types = {
        'md': 'markdown',
        'page': 'page',
        'end': 'end',
    }
    for k in types:
        if k in options:
            line_type = types[k]
            options.remove(k)
    return { 'type':line_type, 'options':options }

def test_parse_special_delimiter_line():
    assert parse_special_delimiter_line(r'#%%') == { 'type': 'markdown', 'options': []}
    assert parse_special_delimiter_line(r'#%') == { 'type': 'code', 'options': []}
    with pytest.raises(Exception):
        parse_special_delimiter_line(r'#%md')
    assert parse_special_delimiter_line(r'#% noexec') == { 'type': 'code', 'options': ['noexec']}
    assert parse_special_delimiter_line(r'#% md') == { 'type': 'markdown', 'options': []}
    assert parse_special_delimiter_line(r'#% hidden noexec') == { 'type': 'code', 'options': ['hidden', 'noexec']}

def parse(text):
    ''' Given PyBook format text described in FileSpec.md, return dictionary object representing JSON notebook '''
    # Strategy is to accumulate lines into latest item, and items into latest page, etc.
    idnum = 1
    pages = [] # Array of pages
    page = [] # Array of items
    item = [] # Array of lines
    current_type = 'start' # Assume we start in unknown type
    current_options = []

    def finish_item():
        nonlocal idnum
        nonlocal page
        nonlocal item
        nonlocal current_type
        nonlocal current_options
        if current_type == 'start':
            # Ignore things before first delim
            item = []
            current_type = ''
            current_options = []
            return
        if current_type == '':
            item = []
            return # No item to finish
        item_str = '\n'.join(item)
        cell = { 'id':idnum, 'cell_type':current_type, 'source':item_str, 'outputs':[] }
        for option in current_options:
            cell[option] = True
        idnum += 1
        if current_type == 'markdown':
            cell['subtype'] = 'view'
        page.append(cell)
        item = []
        current_type = ''
        current_options = []

    def finish_page():
        nonlocal pages
        nonlocal page
        finish_item()
        if len(page) == 0:
            return # No page to finish
        pages.append(page)
        page = []

    lines = split_by_lines(text)
    for line in lines:
        if is_special_delimiter(line):
            delim = parse_special_delimiter_line(line)
            def markdown_func():
                nonlocal current_type
                nonlocal current_options
                finish_item()
                current_type = delim['type']
                current_options = delim['options']
            def code_func():
                nonlocal current_type
                nonlocal current_options
                finish_item()
                current_type = delim['type']
                current_options = delim['options']
            matches = {
                'markdown': markdown_func,
                'code': code_func,
                'page': finish_page,
                'end': finish_item,
            }
            if delim['type'] in matches:
                matches[delim['type']]()
            else:
                raise Exception('Unexpected delimiter: ' + delim['type'])
        else:
            item.append(line)
    finish_page()
    return pages

def unparse_cell(cell):
    header = r'#%%'
    options = []
    if cell['cell_type'] == 'code':
        header = r'#%'
    if 'hidden' in cell and cell['hidden']:
        options.append('hidden')
    if 'startup' in cell and cell['startup']:
        options.append('startup')
    if 'submit' in cell and cell['submit']:
        options.append('submit')
    for option in options:
        header += ' ' + option
    return header + '\n' + cell['source'] + '\n'

def unparse_page(page):
    return ''.join([unparse_cell(cell) for cell in page])

def unparse(pages):
    ''' Given PyBook JSON notebook object, return string in FileSpec.md format '''
    # Currently ignores output
    return '#% page\n'.join([unparse_page(page) for page in pages])

def test_parse():
    txt1 = '''#%% hidden
# Headline
#%
print(42)
'''
    assert parse(txt1) == [[
        {
            'id': 1,
            'cell_type': 'markdown',
            'hidden': True,
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
    assert unparse(parse(txt1)) == txt1
    assert parse(unparse(parse(txt1))) == parse(txt1)

    txt2 = '''#% md
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
'''
    assert parse(txt2) == [
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
            'startup': True,
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
            'cell_type': 'code',
            'submit': True,
            'source': '# hi',
            'outputs': [],
        },
    ]]
    # Can't test unparse(parse(txt2)) == txt2 because the unparse chooses different ways to represent the notebook
    assert parse(unparse(parse(txt2))) == parse(txt2)

'''

'''
    