#!/bin/bash
export ML_PORT=${ML_PORT:-5100}
export PYTHONPATH=/home/runner/workspace/.pythonlibs/lib/python3.11/site-packages:$PYTHONPATH
export PATH=/home/runner/workspace/.pythonlibs/bin:$PATH

cd /home/runner/workspace/artifacts/flask-ml
exec /home/runner/workspace/.pythonlibs/bin/gunicorn \
    --bind "0.0.0.0:${ML_PORT}" \
    --workers 1 \
    --timeout 120 \
    app:app
