#!/bin/sh

cp src/typescript/bin/lib.* lib/
tsc -m commonjs -t ES5 src/index.ts --out index.js
./run-tests.sh