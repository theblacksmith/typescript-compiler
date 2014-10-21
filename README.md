typescript-compiler
===================

Typescript compiler wrapper. Exposes the TypeScript command line compiler to your code.

Installing
-----------------------

    $ npm install typescript-compiler

Usage
-----------------------

Require the compiler...

    var tsc = require('typescript-compiler');

call it!

    tsc.compile(['a.ts', 'b.ts'], ['--out', 'out.js'])

## Module Interface

### libdPath

The path of `lib.d.ts`

### compile(files, tscArgs, onError)

#### files

**required** - Type: `array`

A list of files to be compiled.

#### tscArgs

**optional** - Type: `string` or `array` - Default: `[]`

Arguments to be passed to the compiler

- `string`
    An string containing the arguments as you would use on the terminal but **without the files** to compile.
    E.g. `"--target ES5"`
- `array`
    Each item in the array is a "word" in the command line. Options which receive parameters
    are split into two elements, i.e., to pass `--target ES5` you need to pass to `compile` an array like this:
    `['--target', 'ES5']`.


Check the  options for the current version:

```
Version 1.1.0.1
Syntax:   tsc [options] [file ...]

Examples: tsc hello.ts
          tsc --out foo.js foo.ts
          tsc @args.txt

Options:
 -d, --declaration  Generates corresponding '.d.ts' file.
 -h, --help         Print this message.
 --mapRoot          Specifies the location where debugger should locate map files instead of generated locations.
 -m, --module       Specify module code generation: 'commonjs' or 'amd'
 --noImplicitAny    Warn on expressions and declarations with an implied 'any' type.
 --out              Concatenate and emit output to single file.
 --outDir           Redirect output structure to the directory.
 --removeComments   Do not emit comments to output.
 --sourceMap        Generates corresponding '.map' file.
 --sourceRoot       Specifies the location where debugger should locate TypeScript files instead of source locations.
 -t, --target       Specify ECMAScript target version: 'ES3' (default), or 'ES5'
 -v, --version      Print the compiler's version.
 -w, --watch        Watch input files.
 @<file>            Insert command line options and files from a file.
```

### Example

    tsc.compile(['a.ts', 'b.ts'], "-d -t ES5 --out out.js");


Credits
==========

Initial code created by [iano](https://npmjs.org/~iano)
which was inspired by [typescript-wrapper](https://npmjs.org/package/typescript-wrapper)
