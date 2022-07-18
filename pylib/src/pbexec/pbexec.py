"""

Given python script of a notebook cell, evaluate it and return
the value of the expressions.

Overwrites some system modules with notebook functionality.

"""

import ast
import copy
import contextlib
import io
import sys
import traceback

def fresh_state():
    """
    Generate fresh dictionary to be used for globals

    """
    return {}

def duplicate_state(state):
    """
    Duplicate state so we can have divergence between states
    
    Note that this requires all values in the state to be copyable by copy.deepcopy.
    If a class needs special handling to handle deep copying, then it needs to implement the
    __deepcopy__ method as specified in copy.deepcopy.

    If the state contains values that are not pickleable then the deep copy will fail.
    This could be things like open files, locks, and other values that are designed
    to not be copyable. In this case duplicate_state will raise a KeyError for the
    key in the state that produced the exception.

    """
    res = {}
    for key, value in state.items():
        try:
            res[key] = copy.deepcopy(state[key])
        except Exception as err:
            raise KeyError(key)
    return res

def default_func(value):
    """
    Default function to call on evaluated values

    Default behavior is to totally ignore None values, and to print arrow then repr of other values.
    Could be improved to detect when values have IPython style rich repr

    """
    if value is not None:
        print(f'→ {repr(value)}')

def run_cell(script, globals_=None, locals_=None, func=default_func, history=True):
    """
    Run script with given globals and locals environment
    
    Call func on each expression to do something with value (otherwise return values ignored).
    If history is True, append script to __history in global state.
    
    """
    if globals_ is None:
        globals_ = globals()
    if locals_ is None:
        locals_ = globals_
    # Store func in global scope so we can reliably refer to it anywhere in the script
    if func is not None:
        globals_['__expr_callback'] = func
    # Append actual text passed to history (even if parsing etc. fails it is part of history)
    globals_.setdefault('__history', []).append(script)
    cell = script
    try:
        node = ast.parse(cell)
    except SyntaxError as err:
        exc_type, exc_value, exc_tb = sys.exc_info()
        traceback.print_exception(exc_type, exc_value, exc_tb.tb_next.tb_next)
        return
    if func is not None:
        # Replace all expressions with calls to __expr_callback to process values
        statements = node.body
        for index in range(len(statements)):
            if isinstance(statements[index], ast.Expr):
                value = node.body[index].value
                node.body[index] = ast.Expr(ast.Call(ast.Name('__expr_callback', ast.Load()), args=[value], keywords=[]))
        # Fill in line/col numbers for programmatically modified nodes
        ast.fix_missing_locations(node)
    # Compile wrapped script, run wrapper definition
    try:
        exec(compile(node, filename='<eval>', mode='exec'), globals_, locals_)
    except BaseException as err:
        exc_type, exc_value, exc_tb = sys.exc_info()
        traceback.print_exception(exc_type, exc_value, exc_tb.tb_next)
    sys.stdout.flush()
    sys.stderr.flush()
    return

def dotest():
    test='''x = 5; 12; x; x+=1; x'''
    test2='''y+1'''
    results = []
    def callback(v):
        results.append(v)
    run_cell(test, globals(), globals(), callback)
    assert(results == [12, 5, 6])
    results = []
    global y
    y = 10
    run_cell(test2, globals(), globals(), callback)
    assert(results == [11])

    run_cell('print(1); 2; x=3; x; x+=1; print(x); x+1')
    # This test should show:
    #    1
    #    → 2
    #    → 3
    #    4
    #    → 5
    # This test should show:
    #    [1]
    #    [→ 2]
    #    [→ 3]
    #    [4]
    #    [→ 5]

##################
# Things specific to pybook
##################

class WriteCustom:
    '''
    Helper class to line-buffer writes redirected from user cells.

    '''
    def __init__(self, handler):
        self.handler = handler
    def write(self, data):
        self.handler(data)
    def flush(self):
        pass

class ReadCustom:
    '''
    Helper class to line-buffer reads redirected from user cells.

    '''
    def __init__(self, handler):
        self.handler = handler
    def read(self):
        return self.handler()
    def readline(self):
        s = ''
        while True:
            c = self.handler()
            if c is None:
                return s
            s = s + chr(c)
    def flush(self):
        pass

class redirect_stdin(contextlib._RedirectStream):
    ''' Redirect stdin '''
    _stream = "stdin"

def wrapped_run_cell(*args, **kwargs):
    """
    Same interface as run_cell but wrap stdout, stdin, and stderr with pybook interface.

    Writing lines to stdout will call pybook.output_stdout, writing lines to stderr
    will call pybook.output_stderr. Input is not currently working...
    
    """
    import pybook
    out = WriteCustom(pybook.output_stdout)
    err = WriteCustom(pybook.output_stderr)
    inp = ReadCustom(pybook.input_stdin)
    with contextlib.redirect_stdout(out):
        with contextlib.redirect_stderr(err):
            with redirect_stdin(inp):
                run_cell(*args, **kwargs)

def redefine_builtins():
    import pybook
    # Wrap built-in module functions
    import time
    time.sleep = pybook.sleep

def register_pickle():
    '''
    Register pickle and unpickle functions for data structures not normally supported by pickle.

    This is needed for duplicating state for doing checkpoints and other things.
    Types such as `<class 'module'>` are not supported in pickle, means that if you do:

        import sys

    or similar then the symbol `sys` in the state has trouble being copied.

    This is also a problem for files, even if the files are already closed. For pybook all the
    file operations are just in memory, file corruption is not a big deal so we just record
    some basic info related to the file object and recreate it during deserialization with
    an `open` and `seek()`.

    Another annoyance is the module pybook (which is a JsProxy). That also doesn't pickle
    by default.

    '''
    import copyreg
    import io
    import pybook

    def __pickler(m):
        # Record name of module, e.g. "copyreg" or "sys"
        return m.__name__

    def __unpickler(data):
        # Just look in available modules for the name
        # The state duplication of dictionary happens in context of fixed interpreter.
        # The module we get here will match the original exactly.
        return sys.modules[data]

    copyreg.pickle(type(copyreg), __pickler, __unpickler)
    # Special handling for JsProxy type (hard to get type unless we have a module)
    copyreg.pickle(type(pybook), __pickler, __unpickler)

    def __file_pickler(f):
        pos = 0
        if not f.closed:
            f.flush()
            pos = f.tell()
        return __file_unpickler, (f.closed, f.name, f.mode, pos)

    def __file_unpickler(closed, name, mode, pos):
        # Need to be careful about truncating files here
        # Change any 'w' character in mode to 'a'
        mode = mode.replace('w', 'a')
        # Remove any x (exclusive file creation)
        mode = mode.replace('x', '')
        f = open(name, mode)
        if closed:
            f.close()
        else:
            f.seek(pos)
        return f

    # Need to cover all the cases for different modes
    copyreg.pickle(io.TextIOWrapper, __file_pickler)
    copyreg.pickle(io.BufferedReader, __file_pickler)
    copyreg.pickle(io.BufferedWriter, __file_pickler)
    copyreg.pickle(io.BufferedRandom, __file_pickler)
    copyreg.pickle(io.FileIO, __file_pickler)

def test_deepcopy():
    a = { 'os':sys.modules['os'], 'x':[1, 2, sys.modules['copy']] }
    b = copy.deepcopy(a)
    a['os'] = 'changed'
    assert(b['x'][0] == 1)
    assert(b['os'] == sys.modules['os'])
    assert(b['x'][2] == sys.modules['copy'])

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

if __name__ == '__main__':
    # Do simple tests if run at command line
    dotest()
    register_pickle()
    test_deepcopy()
else:
    # Used in notebook
    try:
        redefine_builtins()
    except:
        print('Could not redefine builtins')
