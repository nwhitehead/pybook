"""

Given python script of a notebook cell, evaluate it and return
the value of the last expression.

"""

import ast
import sys
import traceback

# Global counter for fresh id creation
uid = 1

def run_cell(script, globals_=None, locals_=None):
    """
    Run script with given globals and locals environment
    
    Returns value of last expression or None
    
    """
    global uid
    if globals_ is None:
        globals_ = globals()
    if locals_ is None:
        locals_ = globals_
    cell = script
    node = ast.parse(cell)
    # Dig into ast to get to usercode list of statements/expressions
    statements = node.body
    # If last statement is Expr, turn it into assignment to store result
    # Use fresh uid for each result
    resultid = '__result_{}__'.format(uid)
    uid += 1
    expr = False
    if isinstance(statements[-1], ast.Expr):
        expr = True
        value = node.body[-1].value
        node.body[-1] = ast.Assign(targets=[ast.Name(id=resultid, ctx=ast.Store())], value=value)
    ast.fix_missing_locations(node)
    # Compile wrapped script, run wrapper definition
    try:
        exec(compile(node, filename='<ast>', mode='exec'), globals_, locals_)
        if expr:
            result = locals_[resultid]
            del locals_[resultid]
            return result
        else:
            return None
    except SyntaxError as err:
        exc_type, exc_value, exc_tb = sys.exc_info()
        traceback.print_exception(exc_type, exc_value, exc_tb.tb_next)
    except SyntaxError as err:
        exc_type, exc_value, exc_tb = sys.exc_info()
        traceback.print_exception(exc_type, exc_value, exc_tb.tb_next)
    return None

def dotest():
    test='''x = 5; 12'''
    test2='''x+1'''
    assert(run_cell(test, globals(), globals()) == 12)
    assert(run_cell(test2, globals(), globals()) == 6)

if __name__ == '__main__':
    dotest()
