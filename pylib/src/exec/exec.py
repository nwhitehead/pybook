"""

Given python script of a notebook cell, evaluate it and return
the value of the expressions.

Overwrites some system modules with notebook functionality.

"""

import ast
import contextlib
import io
import sys
import traceback

def default_func(value):
    if value is not None:
        print(f'→ {repr(value)}')

def run_cell(script, globals_=None, locals_=None, func=default_func):
    """
    Run script with given globals and locals environment
    
    Call func on each expression to do something with value (otherwise return values ignored)
    
    """
    if globals_ is None:
        globals_ = globals()
    if locals_ is None:
        locals_ = globals_
    globals_['__expr_callback'] = func
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
    except SyntaxError as err:
        exc_type, exc_value, exc_tb = sys.exc_info()
        traceback.print_exception(exc_type, exc_value, exc_tb.tb_next)
    except Exception as err:
        exc_type, exc_value, exc_tb = sys.exc_info()
        traceback.print_exception(exc_type, exc_value, exc_tb.tb_next)
    except KeyboardInterrupt as err:
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

def wrapped_run_cell(*args, **kwargs):
    import pybook
    out = WriteBuffer(pybook.output_stdout)
    err = WriteBuffer(pybook.output_stderr)
    with contextlib.redirect_stdout(out):
        with contextlib.redirect_stderr(err):
            run_cell(*args, **kwargs)

def redefine_builtins():
    import pybook
    # Wrap built-in module functions
    import time
    time.sleep = pybook.sleep

if __name__ == '__main__':
    # Do simple tests if run at command line
    dotest()
else:
    # Used in notebook
    try:
        redefine_builtins()
    except:
        print('Could not redefine builtins')