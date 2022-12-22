
#m> # Purely Functional Data Structures
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
#m> ## namedtuple
#m>
#m> The Python standard library `collections` includes `namedtuple`. This is a factory method for creating
#m> new tuple subclasses where the fields of the tuple have names. We'll use this to create our purely functional
#m> data structures. Since `tuple` values are immutable, `namedtuple` classes are also immutable which is what we want.
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

### Implementation

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

### Demo

# Let's play around with the functions
s = new()
s2 = push(s, 3)
s3 = push(s2, 10)
v, s4 = pop(s3)
print(v) # should print 10
v2, s5 = pop(s4)
print(v2) # should print 3
# Note that here at the end we still have access
# to all intermediate states if we want them.

# We can also ignore the original state if we want. Users of the functional data structure
# don't need to be purely functional themselves.

s = new()
for i in range(10):
    s = push(s, i)
v, s = pop(s)
print(v)

#m> ## Undo/redo
#m>
#m> Once you have a purely functional data structure, you can keep an array of states
#m> representing the evolution of the state over time. By indexing into older versions
#m> of the state you can implement sophisticated undo/redo functionality.
#m>
#m> Here is an example of a class that keeps track of a history of states. Note that it
#m> assumes that the values will never be mutated. It won't work on mutable values.
#m> The implementation keeps an array of states. The current state is always the last
#m> value in the array, with earlier values at lower indices.
#m>
#m> The example uses the `@property` decorator to allow direct references and updates to the state
#m> value without explicitly going through a getter/setter interface.
#m>

### Implementation

class Undoable:
    ''' Keep track of a changing state, support undo '''

    def __init__(self, initial_state=None):
        self._states = [ initial_state ]

    @property
    def state(self):
        ''' Get the current state '''
        # Current state is always last one in array
        return self._states[-1]

    @state.setter
    def state(self, value):
        ''' Set the state to a new value '''
        self._states.append(value)

    @state.deleter
    def state(self):
        raise AttributeError('Cannot delete state')

    def undo(self, count=1):
        ''' Rewind time by count steps (losing later states), return state '''
        if len(self._states) - count < 1:
            raise IndexError('Requested state does not exist')
        self._states = self._states[:-count]
        return self._states[-1]

    def undo_as_new(self, count=1):
        ''' Add state from count steps in past as new state, return state '''
        if len(self._states) - count < 1:
            raise IndexError('Requested state does not exist')
        state = self._states[-count - 1]
        self._states.append(state)
        return state

### Demo

x = Undoable('Blank slate')
x.state = 'For all the cruelty and hardship of our world, we are not mere prisoners of fate.'
x.state = 'The mind once enlightened cannot again become dark.'
print(x.state)
x.undo()
x.undo()
print(x.state)

y = Undoable(11)
y.state = 720
y.state = 7920
y.undo_as_new()
print(y.state)
y.undo_as_new()
# This will undo the undo action, we now have [11, 720, 7920, 720, 7920] in history
print(y.state)
