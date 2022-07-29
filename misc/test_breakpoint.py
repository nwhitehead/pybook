import signal
import pdb
import sys

saved = None

x = 1

def atNextBytecode(func):
    global saved
    saved = sys.gettrace()
    def doit(frame, event, arg):
        sys.settrace(saved)
        func(frame, event, arg)
    sys.settrace(doit)

def trace(frame, event, arg):
    print('debug', frame, event, arg)
    return

def __handleTrap(number, frame):
    global x
    x = 0
    atNextBytecode(trace)

signal.signal(signal.SIGINT, __handleTrap)
#sys.settrace(trace)

while True:
    print(x)
    x += 1
