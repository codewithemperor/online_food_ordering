#!/bin/bash
cd /home/z/my-project
exec npx next dev -p 3000 --hostname 0.0.0.0 2>&1
