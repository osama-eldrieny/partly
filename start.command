#!/bin/zsh
cd "$(dirname "$0")"
.venv/bin/python server.py &
sleep 1
open http://localhost:8791/index.html http://localhost:8791/system.html http://localhost:8791/presentation.html
wait
