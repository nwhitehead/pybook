#include <cassert>
#include <codecvt>
#include <cstdlib>
#include <iostream>
#include <locale>
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
EM_JS(int, output_text_content, (const char* content_type_c, const char* content_data_c), {
    var content_type = UTF8ToString(content_type_c);
    var content_data = UTF8ToString(content_data_c);
    if (typeof handle_output_text_content == "function") {
        return handle_output_text_content(content_type, content_data);
    }
    console.log('output_text_content', content_type, content_data);
    return 0;
});

EM_JS(int, output_binary_content, (const char* content_type_c, const char* content_data_start, const char* content_data_end), {
    var content_type = UTF8ToString(content_type_c);
    var content_data = Module.HEAP8.subarray(content_data_start, content_data_end);
    if (typeof handle_output_binary_content == "function") {
        return handle_output_binary_content(content_type, content_data);
    }
    console.log('output_binary_content', content_type, content_data);
    return 0;
});

static PyObject*
pybook_output_binary_content(PyObject *self, PyObject *args)
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
    sts = output_binary_content(content_type, start, end);
    PyBuffer_Release(&buffer);
    return PyLong_FromLong(sts);
}

static PyObject*
pybook_output_text_content(PyObject *self, PyObject *args)
{
    const char* content_type;
    const char* content_data;
    int sts;

    if (!PyArg_ParseTuple(args, "ss", &content_type, &content_data))
    {
        return nullptr;
    }
    sts = output_text_content(content_type, content_data);
    return PyLong_FromLong(sts);
}

static PyMethodDef PybookMethods[] = {
    {"output_text_content",  pybook_output_text_content, METH_VARARGS,
     "Output rich content from pybook cells."},
    {"output_binary_content",  pybook_output_binary_content, METH_VARARGS,
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
        std::wstring_convert<std::codecvt_utf8_utf16<wchar_t>> converter;
        std::wstring wpath = converter.from_bytes(mPath.c_str());

        // When PYTHONHOME is set before init, turns off automatic searching by python
        setenv("PYTHONHOME", "/", 0);

        // Explicit path to zip archives
        Py_SetPath(wpath.c_str());

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
    Kernel(std::string path)
    : mPath(path)
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
    void eval(std::string input)
    {
        get_shared_interrupt(SHARED_BUSY, 1);
        PyObject *result = PyObject_CallFunction(run_cell, "sO", input.c_str(), locals);
        if (!result)
        {
            get_shared_interrupt(SHARED_BUSY, 0);
            PyErr_Print();
            return;
        }
        Py_XDECREF(result);
        get_shared_interrupt(SHARED_BUSY, 0);
    }
private:
    std::string mPath;
    PyObject *globals = nullptr;
    PyObject *locals = nullptr;
    PyObject *run_cell = nullptr;
};



/////////////////////////

// Unmangled low-level C API that is callable directly


typedef void* KernelP; // opaque pointer

extern "C" {

KernelP Kernel_new(const char *path);
void Kernel_delete(KernelP kernel);
void Kernel_reset(KernelP kernel);
void Kernel_eval(KernelP kernel, const char *input);
const char* Kernel_version();

}

KernelP Kernel_new(const char *path)
{
    return reinterpret_cast<KernelP>(new Kernel(path));
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

void Kernel_eval(KernelP kernel, const char *input)
{
    Kernel *k = reinterpret_cast<Kernel*>(kernel);
    assert(k);
    k->eval(input);
}

const char* Kernel_version() 
{
    return Py_GetVersion();
}