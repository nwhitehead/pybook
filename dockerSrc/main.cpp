#include <cassert>
#include <cstdlib>
#include <iostream>
#include <stdexcept>
#include <string>

#include <emscripten.h>
#include <Python.h>
#include <frameobject.h>

#define FAIL(msg) assert(0 && msg)

constexpr int SHARED_BUSY = 1;

EM_JS(int, get_shared_interrupt, (int n, int newval), {
    var result = sharedArray[n];
    sharedArray[n] = newval;
    return result;
});


int main(int argc, char** argv) {
    setenv("PYTHONHOME", "/", 0);

    Py_SetPath(L"/lib/python3.7:/lib/python3.7/localroot.zip:/lib/python3.7/python3.7.zip");

    Py_InitializeEx(0);

    emscripten_exit_with_live_runtime();
    return 0;
}

class Kernel
{
public:
    Kernel()
    {
        PyObject *main_module = PyImport_AddModule("__main__");
        globals = PyModule_GetDict(main_module);
        locals = PyDict_New();
        int res = PyRun_SimpleString("from exec import run_cell");
        if (res)
        {
            PyErr_Print();
            FAIL("import of run_cell failed");
        }
        run_cell = PyRun_String("run_cell", Py_eval_input, globals, globals);
        if (!run_cell)
        {
            PyErr_Print();
            FAIL("eval of run_cell failed");
        }
    }
    ~Kernel()
    {
        Py_DECREF(locals);
    }
    std::string eval(std::string input)
    {
        get_shared_interrupt(SHARED_BUSY, 1);
        PyObject *result = PyObject_CallFunction(run_cell, "sO", input.c_str(), locals);
        if (!result)
        {
            get_shared_interrupt(SHARED_BUSY, 0);
            PyErr_Print();
            return std::string("");
        }
        PyObject* repr = PyObject_Repr(result);
        if (!repr)
        {
            get_shared_interrupt(SHARED_BUSY, 0);
            PyErr_Print();
            Py_XDECREF(result);
            return std::string("");
        }
        PyObject* str = PyUnicode_AsEncodedString(repr, "utf-8", "~E~");
        if (!str)
        {
            get_shared_interrupt(SHARED_BUSY, 0);
            PyErr_Print();
            Py_XDECREF(repr);
            Py_XDECREF(result);
            return std::string("");
        }
        const char *bytes = PyBytes_AS_STRING(str);
        std::string out = std::string(bytes);
        Py_XDECREF(str);
        Py_XDECREF(repr);
        Py_XDECREF(result);
        get_shared_interrupt(SHARED_BUSY, 0);
        return out;
    }
private:
    PyObject *globals = nullptr;
    PyObject *locals = nullptr;
    PyObject *run_cell = nullptr;
};




typedef void* KernelP;
typedef void* ResultP;

extern "C" {

KernelP Kernel_new();
void Kernel_delete(KernelP kernel);
ResultP Kernel_eval(KernelP kernel, char *input);
const char* Result_str(ResultP result);
void Result_delete(ResultP result);

}

KernelP Kernel_new()
{
    return reinterpret_cast<KernelP>(new Kernel());
}

void Kernel_delete(KernelP kernel)
{
    assert(kernel);
    delete reinterpret_cast<Kernel*>(kernel);
}

ResultP Kernel_eval(KernelP kernel, char *input)
{
    Kernel *k = reinterpret_cast<Kernel*>(kernel);
    assert(k);
    std::string result = k->eval(input);
    return reinterpret_cast<ResultP>(new std::string(result));
}

const char* Result_str(ResultP result)
{
    assert(result);
    return reinterpret_cast<std::string*>(result)->c_str();
}

void Result_delete(ResultP result)
{
    assert(result);
    delete reinterpret_cast<std::string*>(result);
}
