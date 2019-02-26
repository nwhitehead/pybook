"""

Given python script of a notebook cell, evaluate it and return
the value of the last expression.

"""

import ast
from textwrap import indent, dedent

def _wrap(code):
    """Wrap cell code inside a function"""
    return """
def __wrapper__():
{usercode}
    """.format(usercode=indent(code, " " * 4))

def run_cell(script, globals_=None, locals_=None):
    """
    Run script with given globals and locals environment
    
    Returns value of last expression or None
    
    """
    if globals_ is None:
        globals_ = globals()
    if locals_ is None:
        locals_ = globals_
    cell = _wrap(script)
    node = ast.parse(cell)
    # Dig into ast to get to usercode list of statements/expressions
    statements = node.body[0].body
    # If last statement is Expr, add a return to it
    if isinstance(statements[-1], ast.Expr):
        value = node.body[0].body[-1].value
        node.body[0].body[-1] = ast.Return(value)
    ast.fix_missing_locations(node)
    # Compile wrapped script, run wrapper definition
    exec(compile(node, filename='<ast>', mode='exec'), globals_, locals_)
    print(locals_)
    return locals_['__wrapper__']()
