'''

Pure Python version of PyBook module

This module is for testing. The actions from the normal PyBook module are here done
on a Python data structure representing the notebook cell outputs.

'''

# This global variable represents the state of the cell
outputs = []

def _add_output(data):
    ''' Append text if data is same channel as last message in outputs, otherwise append new text '''
    if len(outputs) > 0 and 'name' in outputs[-1] and 'name' in data and 'text/plain' in outputs[-1] and 'text/plain' in data and outputs[-1]['name'] == data['name']:
        outputs[-1]['text/plain'] += data['text/plain']
        return
    outputs.append(data)

def reset_outputs():
    outputs.clear()

def get_outputs():
    return outputs

def sleep(sec):
    pass

def output_stdout(msg):
    _add_output({ 'name': 'stdout', 'text/plain': msg })

def output_stderr(msg):
    _add_output({ 'name': 'stderr', 'text/plain': msg })

def input_stdin():
    pass

## Following are specific to testing environment

async def test_run_outputs(txt):
    reset_outputs()
    from pbexec import pbexec
    await pbexec.wrapped_run_cell(txt)
    return outputs

def sync_test_run_outputs(txt, user=''):
    # Allow nested event loops
    import nest_asyncio
    nest_asyncio.apply()

    reset_outputs()
    from pbexec import pbexec
    import asyncio
    loop = asyncio.get_event_loop()
    async def f():
        state = globals()
        state['__input'] = user
        await pbexec.wrapped_run_cell(txt, globals_=state, print_exception=False, propagate_exception=True)
    loop.run_until_complete(f())
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
