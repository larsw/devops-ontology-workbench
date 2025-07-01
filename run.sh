#!/bin/sh

python3 -m http.server 1234 &
sleep 1
open http://localhost:1234/

