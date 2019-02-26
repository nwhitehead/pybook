#include <cassert>
#include <cstdlib>
#include <string>

#include <emscripten.h>
#include <Python.h>


int main(int argc, char** argv) {
    setenv("PYTHONHOME", "/", 0);

    Py_SetPath(L"/lib/python3.5:/lib/python3.5/localroot.zip");

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
    }
    ~Kernel()
    {
        Py_DECREF(locals);
    }
    std::string eval(std::string input)
    {
        PyObject *result = PyRun_String(input.c_str(), Py_eval_input, globals, locals);
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
