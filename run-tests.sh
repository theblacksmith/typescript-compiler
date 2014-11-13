#!/bin/sh

tsc -m commonjs -t ES5 test/*.ts
mocha