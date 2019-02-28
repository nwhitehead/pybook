#include <cassert>
#include <cstdlib>
#include <iostream>
#include <stdexcept>
#include <string>

#include <emscripten.h>
#include <Python.h>
#include <frameobject.h>

int main(int argc, char** argv) {
    setenv("PYTHONHOME", "/", 0);

    Py_SetPath(L"/lib/python3.5:/lib/python3.5/localroot.zip:/lib/python3.5/python3.5.zip");

    Py_InitializeEx(0);

    emscripten_exit_with_live_runtime();
    return 0;
}

extern "C" int pycallback(void* arg);

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
            std::cout << "import of run_cell: " << res << std::endl;
            PyErr_Print();
            throw std::runtime_error("import of run_cell failed");
        }
        run_cell = PyRun_String("run_cell", Py_eval_input, globals, globals);
        if (!run_cell)
        {
            PyErr_Print();
            throw std::runtime_error("eval of run_cell failed");
        }
        int r = Py_AddPendingCall(&pycallback, this);
        if (r)
        {
            std::cout << "Py_AddPendingCall failed" << std::endl;
            throw std::runtime_error("Py_AddPendingCall failed");
        }
    }
    ~Kernel()
    {
        Py_DECREF(locals);
    }
    std::string eval(std::string input)
    {
        PyObject *result = PyObject_CallFunction(run_cell, "sO", input.c_str(), globals);
        if (!result)
        {
            PyErr_Print();
            return std::string("ERROR in eval");
        }
        PyObject* repr = PyObject_Repr(result);
        if (!repr)
        {
            PyErr_Print();
            Py_XDECREF(result);
            return std::string("ERROR in repr");
        }
        PyObject* str = PyUnicode_AsEncodedString(repr, "utf-8", "~E~");
        if (!str)
        {
            PyErr_Print();
            Py_XDECREF(repr);
            Py_XDECREF(result);
            return std::string("ERROR in utf-8 conversion");
        }
        const char *bytes = PyBytes_AS_STRING(str);
        std::string out = std::string(bytes);
        Py_XDECREF(str);
        Py_XDECREF(repr);
        Py_XDECREF(result);
        return out;
    }
private:
    PyObject *globals = nullptr;
    PyObject *locals = nullptr;
    PyObject *run_cell = nullptr;
};

EM_JS(int, get_shared_interrupt, (int n), {
//    console.log("get_shared_interrupt n=", n);
    var result = sharedArray[n];
    sharedArray[n] = 0;
    return result;
});



int count = 0;

int pycallback(void* arg)
{
    int res = get_shared_interrupt(0);
    //std::cout << "(C) get_shared_interrupt returned " << res << std::endl;
    int r = Py_AddPendingCall(&pycallback, arg);
    if (r)
    {
        std::cout << "Py_AddPendingCall(2) failed" << std::endl;
        throw std::runtime_error("Py_AddPendingCall(2) failed");
    }
    if (res)
    {
        std::cout << "(C) get_shared_interrupt returned " << res << std::endl;
        std::cout << "KEYBOARD INTERRUPT" << std::endl;
        PyErr_SetString(PyExc_KeyboardInterrupt, "Keyboard Interrupt");
//        PyErr_SetInterrupt();
        return -1;
//        throw std::runtime_error("KEYBOARD INTERRUPT");
    }
    return 0;
}

int tracefunc(PyObject *obj, PyFrameObject *frame, int what, PyObject *arg)
{
    std::cout << "tracefunc obj=" << (void*)obj << " frame=" << (void*)frame << " what=" << what << " arg=" << (void*)arg << std::endl;
    return 0;
}


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
