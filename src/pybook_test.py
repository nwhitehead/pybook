'''

Pure Python version of PyBook module

This module is for testing. The actions from the normal PyBook module are here done
on a Python data structure representing the notebook cell outputs.

'''

# This global variable represents the state of the cell
outputs = []

def reset_outputs():
    outputs.clear()

def get_outputs():
    return outputs

def sleep(sec):
    pass

def output_stdout(msg):
    outputs.append({ 'name': 'stdout', 'text/plain': msg })

def output_stderr(msg):
    outputs.append({ 'name': 'stderr', 'text/plain': msg })

def input_stdin():
    pass

async def test_run_outputs(txt):
    reset_outputs()
    from pbexec import pbexec
    await pbexec.wrapped_run_cell(txt)
    return outputs

def sync_test_run_outputs(txt):
    # Allow nested event loops
    import nest_asyncio
    nest_asyncio.apply()

    reset_outputs()
    from pbexec import pbexec
    import asyncio
    loop = asyncio.get_event_loop()
    async def f():
        await pbexec.wrapped_run_cell(txt)
    loop.run_until_complete(f())
    return outputs
