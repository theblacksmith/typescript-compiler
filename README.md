typescript-compiler
===================

Typescript compiler wrapper. Exposes the TypeScript command line compiler to your code.

Usage
==========

    var tsc = require('typescript-compiler');

    tsc.compile(['a.ts', 'b.ts'], ['--out', 'out.js']);


Credits
==========

Initial code created by [iano](https://npmjs.org/~iano) 
which was inspired by [typescript-wrapper](https://npmjs.org/package/typescript-wrapper)