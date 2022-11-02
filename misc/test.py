import traceback
import sys

old = sys.excepthook

def handler(a, b, c):
    old(a, b.with_traceback(c.tb_next), c)
    #traceback.print_exception(a, b, c.tb_next)

sys.excepthook = handler

def f():
    raise Exception

def g():
    return f()

g()

