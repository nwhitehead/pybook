#m> # Purely Functional Data Structures and Undo/Redo
#m>
#m> Normal data structures have state and can be modified by performing operations on the data structure.
#m> For example a stack has operations `push` and `pop` that modify the state.
#m> In constrast, a purely functional data structure only has functions with inputs and outputs.
#m> No modification of the data structure state ever takes place.
#m>
#m> The way this works is that the functions take in an input that represents the data structure and
#m> return an output that represents the updated data structure after performing the operation. The input value
#m> is not modified, it is used to construct the output value.
#m>
#m> The simplest way to implement this would be to copy all the input value to the output. But purely functional
#m> data structures can do better. Because the values are never mutated, we can reuse parts of the input directly
#m> instead of copying them. They will never change themselves so this is safe.
#m>
#m> One important reason you might want to use purely functional data structures like this is to support
#m> undo/redo capabilities. After every operation of a purely functional data structure you will always have
#m> a valid reference to the starting data structure value and the ending data structure value. By keeping track of
#m> both you can support undo and redo operations. Normal data structures that modify values don't have this property.
#m>
#m> ## `namedtuple`
#m>
#m> The Python standard library `collections` includes `namedtuple`. This is a factory method for creating
#m> new tuple subclasses where the fields of the tuple have names. We'll use this to create our purely functional
#m> data structures. Recall that `tuple` values are immutable.
#m>
#m>
#m> ## Stack operations
#m>
#m> To define our purely functional stack, we need the following operations:
#m>
#m> * Create empty stack
#m> * Given a stack and an element, push the element on top of the stack.
#m> * Given a stack, pop the top element off the stack and return it.
#m> * Given a stack, check if it is empty and return `True` or `False`.
#m>
#m> Because we are making this a purely functional data structure, the `push` and `pop` functions will actually return 
#m> the new stack and not modify the input stack.
#m>
#m> To represent an empty stack we'll use `None`.
#m> 
#m> To represent a non-empty stack, we'll use a `namedtuple` with name `Stack` that has fields `top` and `rest`. The field `top`
#m> will contain the element on top of the stack. The field `rest` will be a stack that represents everything else in the stack.
#m>

from collections import namedtuple
Stack = namedtuple('Stack', ['top', 'rest'])

def new():
    ''' Return a new empty stack '''
    return None

def is_empty(stack):
    ''' Check if a stack is empty, return True if it is or False otherwise '''
    return stack is None

def push(stack, value):
    ''' Push a new value on top of an existing stack, return resulting stack '''
    return Stack(top=value, rest=stack)

def pop(stack):
    ''' Pop a value off a stack, return element and new resulting stack '''
    if stack is None:
        raise IndexError('Stack is empty')
    return (stack.top, stack.rest)

def test():
    s = new()
    s2 = push(s, 3)
    s3 = push(s2, 10)
    v, s4 = pop(s3)
    print(v)
    v2, s5 = pop(s4)
    print(v2)

test()
