#m> # Automatic testing with `hypothesis`
#m> 
#m> The `hypothesis` package is a fun way to generate tests for your Python functions. At a high level, you tell it something about
#m> the data that your function accepts and the properties you want to verify. Then it will randomly generate test inputs and check
#m> your properties.
#m>

#p> file=setup.py

from collections import namedtuple
from typing import Optional, NamedTuple

class BinaryTree(NamedTuple):
    ''' A BinaryTree contains an integer value then left and right optional children which are also BinaryTree '''
    value: int
    # We can use a string 'BinaryTree' for the typing hint since the actual BinaryTree class is not defined yet
    left: Optional['BinaryTree']
    right: Optional['BinaryTree']

# Example tiny tree with two elements
test = BinaryTree(1, BinaryTree(2, None, None), None)

#---#

#p> file=__main__.py

from setup import BinaryTree
from setup import test

# Correct solution using recursion
def solution(tree: BinaryTree):
    """ Return height of binary tree """
    height = 0
    if tree.left is not None:
        height = max(height, 1 + solution(tree.left))
    if tree.right is not None:
        height = max(height, 1 + solution(tree.right))
    return height

# Submission to the challenge
def submission(tree: BinaryTree):
    """ Return height of binary tree """
    height = 1
    if tree.left is not None:
        height += submission(tree.left)
    if tree.right is not None:
        height += submission(tree.right)
    return height

# Does it work on our test example?
print(solution(test), submission(test))

# Now let hypothesis find example where the submission does not match the solution
from hypothesis import given
from  hypothesis import strategies as st

# binaryTreeStrategy = st.deferred(lambda: )

binaryTreeStrategy = st.builds(BinaryTree, st.integers(), st.none(), st.none())

@given(binaryTreeStrategy)
def test_solution(x):
    assert submission(x) == solution(x)

test_solution()

