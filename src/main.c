#include <assert.h>
#include <stdlib.h>

#include <emscripten.h>
#include <Python.h>


int main(int argc, char** argv) {
    setenv("PYTHONHOME", "/", 0);

    Py_InitializeEx(0);

    emscripten_exit_with_live_runtime();
    return 0;
}

char *CustomEval(char *input) {
    PyObject *main_module = PyImport_AddModule("__main__");
    PyObject *globals = PyModule_GetDict(main_module);
    PyObject *result = PyRun_String(input, Py_eval_input, globals, globals);
    assert(result);
    Py_DECREF(result);
    return "SOME TEXT";
}

