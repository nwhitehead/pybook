#include <cassert>
#include <cstdlib>
#include <iostream>
#include <stdexcept>
#include <string>

#include <emscripten.h>

// Be careful about ints versus sizes
#define PY_SSIZE_T_CLEAN
#include <Python.h>
#include <frameobject.h>

#define FAIL(msg) assert(0 && msg)

//!
//! Index of busy bit
//! Set by worker, read by main
//!
constexpr int SHARED_BUSY = 1;

//!
//! \brief Get current value and update to new value a shared array index
//!
//! There is a common SharedArrayBuffer between the main thread and
//! the python interpreter web worker so enable asynchronous communication
//! and signalling.
//!
//! \param n Index to query/set
//! \param newval New value to set
//! \returns Old value at index n
//!
EM_JS(int, get_shared_interrupt, (int n, int newval), {
    var result = sharedArray[n];
    sharedArray[n] = newval;
    return result;
});

//!
//! \brief Handle mime-type rich content output
//!
//! Calls js handle_output_content with: content_type (string), content_data (byte array)
//! Logs to console if no js function defined.
//! Return -1 on error, 0 on success
//!
EM_JS(int, output_content, (const char* content_type_c, const char* content_data_start, const char* content_data_end), {
    var content_type = UTF8ToString(content_type_c);
    var content_data = Module.HEAP8.subarray(content_data_start, content_data_end);
    if (typeof handle_output_content == "function") {
        return handle_output_content(content_type, content_data);
    }
    console.log('output_content', content_type, content_data);
    return 0;
});

static PyObject *
pybook_output_content(PyObject *self, PyObject *args)
{
    const char* content_type;
    Py_buffer buffer;
    int sts;

    if (!PyArg_ParseTuple(args, "sy*", &content_type, &buffer))
    {
        return nullptr;
    }
    if (!PyBuffer_IsContiguous(&buffer, 'A'))
    {
        PyBuffer_Release(&buffer);
        return nullptr;
    }
    const char* start = static_cast<const char*>(buffer.buf);
    const char* end = start + buffer.len;
    sts = output_content(content_type, start, end);
    PyBuffer_Release(&buffer);
    return PyLong_FromLong(sts);
}

static PyMethodDef PybookMethods[] = {
    {"output_content",  pybook_output_content, METH_VARARGS,
     "Output rich content from pybook cells."},
    {NULL, NULL, 0, NULL}        /* Sentinel */
};

static struct PyModuleDef pybookmodule = {
    PyModuleDef_HEAD_INIT,
    "pybook", /* name of module */
    NULL,     /* module documentation, may be NULL */
    -1,       /* size of per-interpreter state of the module,
                 or -1 if the module keeps state in global variables. */
    PybookMethods
};

PyMODINIT_FUNC
PyInit_pybook(void)
{
    return PyModule_Create(&pybookmodule);
}

int main(int argc, char** argv) {
    // Do not free memory when main exits
    emscripten_exit_with_live_runtime();
    return 0;
}

class Kernel
{
public:
    void init()
    {
        // When PYTHONHOME is set before init, turns off automatic searching by python
        setenv("PYTHONHOME", "/", 0);

        // Explicit path to zip archives
        Py_SetPath(L"/lib/python3.7:/lib/python3.7/localroot.zip:/lib/python3.7/python3.7.zip");


        PyImport_AppendInittab("pybook", PyInit_pybook);
        Py_InitializeEx(0);

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
        PyImport_ImportModule("spam");
    }
    void destroy()
    {
        Py_DECREF(locals);
        int res = Py_FinalizeEx();
        if (res)
        {
            FAIL("Py_FinalizeEx failed");
        }
    }
    Kernel()
    {
        init();
    }
    ~Kernel()
    {
        destroy();
    }
    void reset()
    {
        destroy();
        init();
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



/////////////////////////

// Unmangled low-level C API that is callable directly


typedef void* KernelP; // opaque pointer
typedef void* ResultP; // opaque pointer

extern "C" {

KernelP Kernel_new();
void Kernel_delete(KernelP kernel);
void Kernel_reset(KernelP kernel);
ResultP Kernel_eval(KernelP kernel, char *input);
const char* Kernel_version();
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

void Kernel_reset(KernelP kernel)
{
    assert(kernel);
    reinterpret_cast<Kernel*>(kernel)->reset();
}

ResultP Kernel_eval(KernelP kernel, char *input)
{
    Kernel *k = reinterpret_cast<Kernel*>(kernel);
    assert(k);
    std::string result = k->eval(input);
    return reinterpret_cast<ResultP>(new std::string(result));
}

const char* Kernel_version() 
{
    return Py_GetVersion();
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
