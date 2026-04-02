import os
import sys

if getattr(sys, "frozen", False):
    # Add _internal dir to DLL search path before anything else loads
    _internal = os.path.join(os.path.dirname(sys.executable), "_internal")
    os.environ["PATH"] = _internal + os.pathsep + os.environ.get("PATH", "")
    if hasattr(os, "add_dll_directory"):
        os.add_dll_directory(_internal)
