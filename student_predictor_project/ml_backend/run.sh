#!/bin/bash
export PYTHONPATH=/home/runner/workspace/.pythonlibs/lib/python3.11/site-packages:$PYTHONPATH
export PATH=/home/runner/workspace/.pythonlibs/bin:$PATH
cd /home/runner/workspace/artifacts/flask-ml
exec python3 /home/runner/workspace/artifacts/flask-ml/app.py
