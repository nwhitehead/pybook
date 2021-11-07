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
    Could be improved to detect when values 

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

class WriteBuffer:
    '''
    Helper class to line-buffer writes redirected from user cells.

    '''
    def __init__(self, handler):
        self.stream = ''
        self.handler = handler
    def _calls(self):
        lines = self.stream.split('\n')
        if len(lines) <= 1:
            return
        for line in lines[:-1]:
            self.handler(line)
        self.stream = lines[-1]
    def write(self, data):
        self.stream += data
        self._calls()
    def flush(self):
        # Output partial line even without newline
        # This won't be exactly correct with newlines, but the explicit flush is asking us to really flush
        if self.stream != '':
            self.handler(self.stream)
            self.stream = ''

class ReadBuffer:
    '''
    Helper class to line-buffer reads redirected from user cells.

    '''
    def __init__(self, handler):
        self.stream = ''
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
    out = WriteBuffer(pybook.output_stdout)
    err = WriteBuffer(pybook.output_stderr)
    inp = ReadBuffer(pybook.input_stdin)
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

    '''
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

def test_deepcopy():
    a = { 'os':sys.modules['os'], 'x':[1, 2, sys.modules['copy']] }
    b = copy.deepcopy(a)
    a['os'] = 'changed'
    assert(b['x'][0] == 1)
    assert(b['os'] == sys.modules['os'])
    assert(b['x'][2] == sys.modules['copy'])

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
