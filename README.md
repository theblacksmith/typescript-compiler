typescript-compiler
===================

Typescript compiler wrapper. Exposes the TypeScript command line compiler to your code.

Usage
-----------------------

Require the compiler...

    var tsc = require('typescript-compiler');

call it! 

    compile(['a.ts', 'b.ts'], ['--out', 'out.js'])

## Module Interface

### libdPath

The path of `lib.d.ts`

### TypeScript

The `TypeScript` class as defined by TypeScript

### IO

The `IO` class as defined by TypeScript

### BatchCompiler

The `BatchCompiler` class as defined by TypeScript

### compile(files, tscArgs, onError)

#### Arguments

##### files

**required** - Type: `array`

A list of files to be compiled.

##### tscArgs

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
Version 0.9.1.1
Syntax:   tsc [options] [file ..]

Examples: tsc hello.ts
          tsc --out foo.js foo.ts
          tsc @args.txt

Options:
  --allowbool                   Allow 'bool' as a synonym for 'boolean'.
  --allowimportmodule           Allow 'module(...)' as a synonym for 'require(...)'.
  -d, --declaration             Generates corresponding .d.ts file
  -h, --help                    Print this message
  --mapRoot LOCATION            Specifies the location where debugger should locate map files instead of generated locations.
  -m KIND, --module KIND        Specify module code generation: "commonjs" or "amd"
  --noImplicitAny               Warn on expressions and declarations with an implied 'any' type.
  --noResolve                   Skip resolution and preprocessing
  --out FILE                    Concatenate and emit output to single file.
  --outDir DIRECTORY            Redirect output structure to the directory
  --removeComments              Do not emit comments to output
  --sourcemap                   Generates corresponding .map file
  --sourceRoot LOCATION         Specifies the location where debugger should locate TypeScript files instead of source locations.
  -t VERSION, --target VERSION  Specify ECMAScript target version: "ES3" (default), or "ES5"
  -v, --version                 Print the compiler's version: 0.9.1.1
  -w, --watch                   Watch input files
  @<file>                       Insert command line options and files from a file.
```

##### onError

**optional** - Type: `function(error: string) : bool` - Default: `io.stderr.WriteLine`

A simple callback function which will be called whenever an error is sent through `io.stderr.WriteLine` with the error message which was sent. 

Return `false` to prevent the default error callback (`io.stderr.WriteLine`) to writing to the stderr output.



### Example

    tsc.compile(['a.ts', 'b.ts'], "--out out.js");


Credits
==========

Initial code created by [iano](https://npmjs.org/~iano) 
which was inspired by [typescript-wrapper](https://npmjs.org/package/typescript-wrapper)
