#m> # Automatic testing with `hypothesis`
#m> 
#m> The `hypothesis` package is a fun way to generate tests for your Python functions. At a high level, you tell it something about
#m> the data that your function accepts and the properties you want to verify. Then it will randomly generate test inputs and check
#m> your properties.
#m>
#m> One way I like to use `hypothesis` is to write "programming challenges". The challenge will have a description of what you need
#m> to do. It will include some setup Python code to help with data structures and similar things. The challenge will ask you to write
#m> a specific function to do something. As the challenge writer, I have a secret solution function that does exactly what I am asking.
#m> Instead of manually coming up with lots of test cases and assertions, I ask `hypothesis` to verify that the challenge submission
#m> and the secret solution behave the same over all possible inputs. If the secret solution is correct, then any difference in behavior
#m> between the submission and the solution is a failure in the submission.
#m>
#m> Here is an example of this technique.

# Challenge: 
#   Given a binary tree, write a function that returns the height of the tree.
#   A tree with only a root node has height 0.

# Binary tree data structure
from collections import namedtuple
from typing import Optional, NamedTuple

class BinaryTree(NamedTuple):
    ''' Contains an integer value then left and right optional children '''
    value: int
    # We can use a string 'BinaryTree' for the typing hint
    # since the actual BinaryTree class is not defined yet.
    left: Optional['BinaryTree']
    right: Optional['BinaryTree']

# Example small tree with two elements
test = BinaryTree(1, BinaryTree(2, None, None), None)

# Correct solution using recursion
def solution(tree: BinaryTree) -> int:
    """ Return height of binary tree """
    height = 0
    if tree.left is not None:
        height = max(height, 1 + solution(tree.left))
    if tree.right is not None:
        height = max(height, 1 + solution(tree.right))
    return height

# Submission to the challenge (doesn't work!)
def submission(tree: BinaryTree) -> int:
    """ Return height of binary tree """
    height = 0
    if tree.left is not None:
        height = 1 + solution(tree.left)
    if tree.right is not None:
        height = 1 + solution(tree.right)
    return height

# Does it work on our test example?
print(f'solution(test)={solution(test)}, submission(test)={submission(test)}')

# Now let hypothesis find example where the submission does not match the solution
from hypothesis import given
from hypothesis import strategies as st

# Generate Optional[BinaryTree] data using recursive strategy
# st.recursive takes base case, then extension function
optionalBinaryTreeStrategy = st.recursive(
    st.none(),
    lambda children: st.builds(BinaryTree, st.integers(), children, children))

# Generate BinaryTree examples by filtering out degenerate None examples
binaryTreeStrategy = optionalBinaryTreeStrategy.filter(lambda x: x is not None)

@given(binaryTreeStrategy)
def test_solution(x : BinaryTree) -> None:
    assert submission(x) == solution(x)

test_solution()

#m>
#m> With this technique you have to be careful to make sure your solution is actually correct. If there are corner cases where the solution breaks down
#m> then `hypothesis` will often find them and mark the submission as incorrect when actually it was a bug in the solution.
#m>
#m> The other tricky part can be describing to `hypothesis` how to generate random examples of your data structure. In the example above I used
#m> one technique for generating random trees using the `st.recursive` strategy. This is generally the recommended approach since `hypothesis` can
#m> control the depth of the final tree accurately. If you use other techniques such as choosing between a base case and recursive case
#m> with `st.one_of` the data structures can grow to unbounded size quickly and cause problems.
#m>
#m> You are also not limited to using `hypothesis` directly for every submission. You can use `hypothesis` to generate a database of test cases
#m> that cover various buggy possible solutions, as well as a database of other random example inputs. Once you have the database of examples
#m> you can use them for testing submissions without needing `hypothesis` at all any more.

