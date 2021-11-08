import copy

#######################
## Can't copy file objects (even if closed)

## Example failure
# with open('blah.txt', 'w') as f:
#     f.write('hello world')
# print(f.closed)
# g = copy.deepcopy(f)

## Solution
import copyreg
import io

def __file_pickler(f):
    pos = 0
    if not f.closed:
        f.flush()
        pos = f.tell()
    return __file_unpickler, (f.closed, f.name, f.mode, pos)

def __file_unpickler(closed, name, mode, pos):
    f = open(name, mode)
    if closed:
        f.close()
    else:
        f.seek(pos)
    return f

copyreg.pickle(io.TextIOWrapper, __file_pickler)
copyreg.pickle(io.BufferedReader, __file_pickler)
copyreg.pickle(io.BufferedWriter, __file_pickler)
copyreg.pickle(io.BufferedRandom, __file_pickler)
copyreg.pickle(io.FileIO, __file_pickler)

## Demonstrate solution works
for mode, pos, closed, write, read, buffering in [
    ('w', 0, True, True, False, -1),
    ('w', 0, False, True, False, -1),
    ('rb', 0, False, False, True, -1),
    ('r', 5, False, False, True, -1),
    ('w+', 5, False, True, True, -1),
    ('wb', 5, False, False, False, -1),
    ('w+b', 5, False, False, True, -1),
    ('w+b', 5, False, False, True, 0),
]:
    with open('blah.txt', mode, buffering=buffering) as f:
        if write:
            f.write('hello world')
        if read:
            f.read()
        f.seek(pos)
        if closed:
            f.close()
        g = copy.deepcopy(f)
        assert(f.name == g.name)
        assert(f.mode == g.mode)
        assert(f.closed == g.closed)
        if not f.closed:
            assert(f.tell() == g.tell())

with open('blah.txt', 'w') as f:
    f.write('hello world')
    g = copy.deepcopy(f)
    assert(f.name == g.name)
    assert(f.mode == g.mode)
    assert(f.closed == g.closed)
    assert(f.tell() == g.tell())

with open('blah.txt', 'rb') as f:
    f.read()
    g = copy.deepcopy(f)
    assert(f.name == g.name)
    assert(f.mode == g.mode)
    assert(f.closed == g.closed)
    assert(f.tell() == g.tell())

#######################
## Can't copy modules

## Example failure
# import sys
# a = sys
# b = copy.deepcopy(a)

## Solution

import copyreg

def __pickler(m):
    # Record name of module, e.g. "copyreg" or "sys"
    return m.__name__

def __unpickler(data):
    # Just look in available modules for the name
    # The state duplication of dictionary happens in context of fixed interpreter.
    # The module we get here will match the original exactly.
    return sys.modules[data]

copyreg.pickle(type(copyreg), __pickler, __unpickler)

## Demonstrate solution works
import sys
a = sys
b = copy.deepcopy(a)

