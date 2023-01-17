import sys
from types import ModuleType

class MockModule(ModuleType):
    def __init__(self, module_name, module_doc=None):
        ModuleType.__init__(self, module_name, module_doc)
        if '.' in module_name:
            package, module = module_name.rsplit('.', 1)
            get_mock_module(package).__path__ = []
            setattr(get_mock_module(package), module, self)

    def _initialize_(self, module_code):
        self.__dict__.update(module_code(self.__name__))
        self.__doc__ = module_code.__doc__

def get_mock_module(module_name):
    if module_name not in sys.modules:
        sys.modules[module_name] = MockModule(module_name)
    return sys.modules[module_name]

def module(module_name, dependencies=[]):
    for d in dependencies:
        get_mock_module(d)
    return get_mock_module(module_name)._initialize_

@module('setup')
def _(__name__):
    def foo(x):
        print(f'foo! {x}')
        return 3
    v = 42
    return locals()

import setup

setup.foo(5)

from setup import v

print(v)
