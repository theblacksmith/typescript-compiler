/// <reference path="types.ts"/>
/// <reference path="typescript/src/compiler/core.ts"/>
/// <reference path="typescript/src/compiler/sys.ts"/>
/// <reference path="typescript/src/compiler/types.ts"/>
/// <reference path="typescript/src/compiler/scanner.ts"/>
/// <reference path="typescript/src/compiler/parser.ts"/>
/// <reference path="typescript/src/compiler/binder.ts"/>
/// <reference path="typescript/src/compiler/checker.ts"/>
/// <reference path="typescript/src/compiler/emitter.ts"/>
/// <reference path="typescript/src/compiler/commandLineParser.ts"/>

/// <reference path="compositeCompilerHost.ts"/>

module tsc {

	export var defaultCompilerOptions = {
		fullTypeCheckMode: true
	}

	function formatError(diagnostic: ts.Diagnostic) {
		var output = "";
		if (diagnostic.file) {
			var loc = diagnostic.file.getLineAndCharacterFromPosition(diagnostic.start);
			output += diagnostic.file.filename + "(" + loc.line + "," + loc.character + "): ";
		}
		var category = ts.DiagnosticCategory[diagnostic.category].toLowerCase();
		output += category + " TS" + diagnostic.code + ": " + diagnostic.messageText + sys.newLine;
		return output;
	}

	function forwardErrors(errors, onError) {
		if(typeof onError == 'function') {
			errors.forEach(e => {
				e.formattedMessage = formatError(e);
				onError(e)
			})
		}
	}

	function _compile(host: CompositeCompilerHost, sources: Source[], tscArgs: string, options?: CompilerOptions, onError?: (message) => void)
	function _compile(host: CompositeCompilerHost, sources: Source[], tscArgs: string[], options?: CompilerOptions, onError?: (message) => void)
	function _compile(host: CompositeCompilerHost, sources: Source[], tscArgs?, options?: CompilerOptions, onError?: (message) => void) : CompilationResult {

		options = options || defaultCompilerOptions;

		if(typeof tscArgs == "string")
			tscArgs = tscArgs.split(' ');
		else
			tscArgs = tscArgs || [];

		var commandLine = ts.parseCommandLine(tscArgs);
		var files;

		if(host.readsFrom == SourceType.String) {
			sources.forEach(s => host.addSource(s.filename, s.contents));
			files = host.getSourcesFilenames();
		}
		else {
			files = ts.map(sources, s => s.filename);
		}

		var program = ts.createProgram(files, commandLine.options, host);

        // Query for early errors
        var errors = [];
        if (options.fullTypeCheckMode)
            errors = program.getDiagnostics();

		// todo: make async
		forwardErrors(errors, onError);

		// Do not generate code in the presence of early errors
		if (!errors.length) {
			var checker = program.getTypeChecker(options.fullTypeCheckMode);

			// Type check and get semantic errors
            var semanticErrors = [];
            if (options.fullTypeCheckMode) {				
                semanticErrors = checker.getDiagnostics();
            }

			// todo: make async
			forwardErrors(semanticErrors, onError);

			// Generate output
			var emitResult = checker.emitFiles();
			// todo: make async
			forwardErrors(emitResult.errors, onError);

			errors = ts.concatenate(semanticErrors, emitResult.errors);
		}

		return {
			sources: host.outputs,
			sourceMaps: emitResult && emitResult.sourceMaps ? emitResult.sourceMaps : [],
			errors: ts.map<any, string>(errors, e => {
				return formatError(e)
			})
		};
	}

	export function compileWithHost(host: CompositeCompilerHost, sources: Source[], tscArgs: ts.ParsedCommandLine, options?: CompilerOptions, onError?: (message) => void)
	export function compileWithHost(host: CompositeCompilerHost, sources: Source[], tscArgs: string[], options?: CompilerOptions, onError?: (message) => void)
	export function compileWithHost(host: CompositeCompilerHost, sources: Source[], tscArgs, options?: CompilerOptions, onError?: (message) => void) {
		return _compile(host, sources, tscArgs, options, onError);
	}

	export function compile(files: string, tscArgs?: string, options?: CompilerOptions, onError?: (message) => void)
	export function compile(files: string, tscArgs?: string[], options?: CompilerOptions, onError?: (message) => void)
	export function compile(files: string[], tscArgs?: string, options?: CompilerOptions, onError?: (message) => void)
	export function compile(files: string[], tscArgs?: string[], options?: CompilerOptions, onError?: (message) => void)
	export function compile(files, tscArgs?, options?, onError?: (message) => void) : CompilationResult {

		if(typeof files == 'string')
			files = [files];

		return _compile(new CompositeCompilerHost(),
							ts.map(<string[]>files, (f) => new FileSource(f)), 
							tscArgs, options, onError);
	}

	export function compileStrings(input: ts.Map<string>, tscArgs?: string, options?: CompilerOptions, onError?: (message) => void)
	export function compileStrings(input: ts.Map<string>, tscArgs?: string[], options?: CompilerOptions, onError?: (message) => void)
	export function compileStrings(input: StringSource[], tscArgs?: string, options?: CompilerOptions, onError?: (message) => void)
	export function compileStrings(input: StringSource[], tscArgs?: string[], options?: CompilerOptions, onError?: (message) => void)
	export function compileStrings(input: string[], tscArgs?: string, options?: CompilerOptions, onError?: (message) => void)
	export function compileStrings(input: string[], tscArgs?: string[], options?: CompilerOptions, onError?: (message) => void)
	export function compileStrings(input, tscArgs?, options?: CompilerOptions, onError?: (message) => void): CompilationResult {
		
		var host = new CompositeCompilerHost()
							.readFromStrings()
							.writeToString();

		var sources = [];

		if(Array.isArray(input) && input.length) {
			// string[]
			if(typeof input[0] == 'string') {
				sources = ts.map<string, StringSource>(input, s => new StringSource(s));
			}
			// Source[]
			else if(input[0] instanceof StringSource) {
				sources.concat(input);
			}
			else
				throw new Error('Invalid value for input argument')
		}
		// dictionary
		else if(typeof input == 'object') {
			for(var k in input) if (input.hasOwnProperty(k))
				sources.push(new StringSource(input[k], k));
		}
		else
			throw new Error('Invalid value for input argument')

		return _compile(host, sources, tscArgs, options, onError);
	}

	export function compileString(input: StringSource, tscArgs?: string, options?: CompilerOptions, onError?: (message) => void)
	export function compileString(input: StringSource, tscArgs?: string[], options?: CompilerOptions, onError?: (message) => void)
	export function compileString(input: string, tscArgs?: string, options?: CompilerOptions, onError?: (message) => void)
	export function compileString(input: string, tscArgs?: string, options?: CompilerOptions, onError?: (message) => void)
	export function compileString(input, tscArgs?, options?: CompilerOptions, onError?: (message) => void): string {
		if(typeof input != "string" && !(input instanceof StringSource))
			throw new Error("typescript-compiler#compileString: input parameter should be either a string or a StringSource object")

		if(input == '') return '';

		var result: string = '';

		var host = new CompositeCompilerHost()
							.readFromStrings()
							.writeToString()
							.redirectOutput((filename, data) => result += data);

		_compile(host, [input instanceof StringSource ? input : new StringSource(input, 'string.ts')], tscArgs, options, onError);

		return result;
	}
}

module.exports = tsc;