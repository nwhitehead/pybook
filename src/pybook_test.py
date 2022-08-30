'''

Pure Python version of PyBook module

This module is for testing. The actions from the normal PyBook module are here done
on a Python data structure representing the notebook cell outputs.

'''

import copy

# This global variable represents the state of the cell
outputs = []

def fresh_state():
    return {}

def duplicate_state(state):
    res = {}
    for key, value in state.items():
        try:
            res[key] = copy.deepcopy(state[key])
        except Exception as err:
            raise KeyError(key)
    return res

def sleep(sec):
    pass

def output_stdout(msg):
    _add_output({ 'name': 'stdout', 'text/plain': msg })

def output_stderr(msg):
    _add_output({ 'name': 'stderr', 'text/plain': msg })

def output_text_content(content_type, content_data):
    if content_type == 'text/html':
        _add_output({ 'text/html': content_data })
    elif content_type == 'text/plain':
        _add_output({ 'name': 'stdout', 'text/plain': content_data })
    elif content_type == 'image/svg+xml':
        _add_output({ 'image/svg+xml': content_data })

def input_stdin():
    pass

## Following are specific to testing environment

def _add_output(data):
    ''' Append text if data is same channel as last message in outputs, otherwise append new text '''
    if len(outputs) > 0 and 'name' in outputs[-1] and 'name' in data and 'text/plain' in outputs[-1] and 'text/plain' in data and outputs[-1]['name'] == data['name']:
        outputs[-1]['text/plain'] += data['text/plain']
        return
    outputs.append(data)

def reset_outputs():
    outputs.clear()

def get_outputs():
    ''' Return current outputs and clear them '''
    global outputs
    result = outputs[:]
    outputs = []
    return result

async def _exec(txt, state=None, user=''):
    if state is None:
        state = globals()
    state['__input'] = user
    from pbexec import pbexec
    await pbexec.wrapped_run_cell(txt, globals_=state, locals_=state, print_exception=False, propagate_exception=True)

async def exec_outputs(txt, state=None, user=''):
    reset_outputs()
    await _exec(txt, state, user)
    return outputs

def sync_exec(txt, state=None, user=''):
    # Allow nested event loops
    import nest_asyncio
    nest_asyncio.apply()

    import asyncio
    loop = asyncio.get_event_loop()
    async def f():
        await _exec(txt, state, user)
    loop.run_until_complete(f())

def sync_exec_outputs(txt, state=None, user=''):
    reset_outputs()
    sync_exec(txt, state, user)
    return outputs

import unittest
tc = unittest.TestCase()

assertEqual = tc.assertEqual
assertNotEqual = tc.assertNotEqual
assertTrue = tc.assertTrue
assertFalse = tc.assertFalse
assertIs = tc.assertIs
assertIsNot = tc.assertIsNot
assertIsNone = tc.assertIsNone
assertIsNotNone = tc.assertIsNotNone
assertIn = tc.assertIn
assertNotIn = tc.assertNotIn
assertIsInstance = tc.assertIsInstance
assertNotIsInstance = tc.assertNotIsInstance

assertRaises = tc.assertRaises
assertRaisesRegex = tc.assertRaisesRegex
assertWarns = tc.assertWarns
assertWarnsRegex = tc.assertWarnsRegex
assertLogs = tc.assertLogs
assertNoLogs = tc.assertNoLogs

assertAlmostEqual = tc.assertAlmostEqual
assertNotAlmostEqual = tc.assertNotAlmostEqual
assertGreater = tc.assertGreater
assertGreaterEqual = tc.assertGreaterEqual
assertLess = tc.assertLess
assertLessEqual = tc.assertLessEqual
assertRegex = tc.assertRegex
assertNotRegex = tc.assertNotRegex
assertCountEqual = tc.assertCountEqual

addTypeEqualityFunc = tc.addTypeEqualityFunc
assertMultiLineEqual = tc.assertMultiLineEqual
assertSequenceEqual = tc.assertSequenceEqual
assertListEqual = tc.assertListEqual
assertTupleEqual = tc.assertTupleEqual
assertSetEqual = tc.assertSetEqual
assertDictEqual = tc.assertDictEqual

fail = tc.fail
