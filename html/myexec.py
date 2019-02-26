import ast
from textwrap import indent, dedent

def _wrap(code):
    return """
def __wrapper__():
    try:
{usercode}
    finally:
        pass
    """.format(usercode=indent(code, " " * 8))

def returnify(script, globals=None, locals=None):
    cell = _wrap(script)
    node = ast.parse(cell)
    # Dig into ast to get to usercode list of statements/expressions
    statements = node.body[0].body[0].body
    # If last statement is Expr, add a return to it
    if isinstance(statements[-1], ast.Expr):
        value = node.body[0].body[0].body[-1].value
        node.body[0].body[0].body[-1] = ast.Return(value)
    ast.fix_missing_locations(node)
    # Compile wrapped script, run wrapper definition
    exec(compile(node, filename='<ast>', mode='exec'), globals, locals)
    return eval('__wrapper__()', globals, locals)

print(returnify("print(32)\nprint(3); 32"))
