/// <reference path="typescript/src/compiler/core.ts"/>
/// <reference path="typescript/src/compiler/sys.ts"/>
/// <reference path="typescript/src/compiler/types.ts"/>
/// <reference path="typescript/src/compiler/scanner.ts"/>
/// <reference path="typescript/src/compiler/parser.ts"/>
/// <reference path="typescript/src/compiler/binder.ts"/>
/// <reference path="typescript/src/compiler/checker.ts"/>
/// <reference path="typescript/src/compiler/emitter.ts"/>
/// <reference path="typescript/src/compiler/commandLineParser.ts"/>
/// <reference path="types.ts"/>

var path = require('path');
var fs = require('fs')

module tsc {

	function shallowClone(obj) {
		var clone: ts.Map<string> = {};
			for (var k in obj) if (obj.hasOwnProperty(k)) {
				clone[k] = obj[k];
			}
			return clone;
	}

	export class CompositeCompilerHost implements ts.CompilerHost {

		private _currentDirectory: string;
		private _writer: IResultWriterFn;
		private _sources: ts.Map<string> = {};
		private _outputs: ts.Map<string> = {};
		public options: CompilerOptions;

		/**
		 * Whether to search for files if a string source isn't found or not
		 */
		fallbackToFiles: boolean = false;

		get sources(): ts.Map<string> {
			return shallowClone(this._sources);
		}

		get outputs(): ts.Map<string> {
			return shallowClone(this._outputs);
		}

		readsFrom: SourceType = SourceType.File;
		writesTo: SourceType = SourceType.File;

		constructor(options : CompilerOptions) {
			this.readsFrom = SourceType.File;
			this.getSourceFile = this._readFromFile;

			this.writesTo = SourceType.File;
			this.writeFile = this._writeToFile;

			this.options = options || {};
			this.options.defaultLibFilename = this.options.defaultLibFilename || '';
		}

		// Implementing CompilerHost interface
		getSourceFile: ISourceReaderFn;

		// Implementing CompilerHost interface
		writeFile: IResultWriterFn;

		// Implementing CompilerHost interface
		getNewLine = (): string => ts.sys.newLine;

		// Implementing CompilerHost interface
		useCaseSensitiveFileNames(): boolean {
			return ts.sys.useCaseSensitiveFileNames;
		}

		// Implementing CompilerHost interface
		getCurrentDirectory(): string {
			if(this.getSourceFile === this._readFromStrings)
				return '';

			return this._currentDirectory || (this._currentDirectory = ts.sys.getCurrentDirectory());
		}

		// Implementing CompilerHost interface
		getDefaultLibFilename(): string {
			return this.options.defaultLibFilename || path.join(__dirname, "lib", "lib.d.ts");
		}

		// Implementing CompilerHost interface
		getCanonicalFileName(fileName: string): string {
			// if underlying system can distinguish between two files whose names differs only in cases then file name already in canonical form.
			// otherwise use toLowerCase as a canonical form.
			return ts.sys.useCaseSensitiveFileNames ? fileName : fileName.toLowerCase();
		}

		readFromStrings(fallbackToFiles: boolean = false): CompositeCompilerHost {
			this.fallbackToFiles = fallbackToFiles;
			this.readsFrom = SourceType.String;
			this.getSourceFile = this._readFromStrings;
			return this;
		}

		readFromFiles(): CompositeCompilerHost {
			this.readsFrom = SourceType.File;
			this.getSourceFile = this._readFromFile;
			return this;
		}

		addSource(contents: string)
		addSource(contents: Source)
		addSource(name: string, contents: string)
		addSource(nameOrContents, contents?): CompositeCompilerHost {
			var source;

			if(typeof contents == 'undefined')
				source = new StringSource(nameOrContents);
			else
				source = new StringSource(contents, nameOrContents);

			this._sources[source.filename] = source.contents;
			return this;
		}

		getSourcesFilenames(): string[] {
			var keys = [];

			for(var k in this.sources) if(this.sources.hasOwnProperty(k))
				keys.push(k);

			return keys;
		}

		writeToString(): CompositeCompilerHost {
			this.writesTo = SourceType.String;
			this.writeFile = this._writeToString;
			return this;
		}

		writeToFiles(): CompositeCompilerHost {
			this.writesTo = SourceType.File;
			this.writeFile = this._writeToFile;
			return this;
		}

		redirectOutput(writer: boolean)
		redirectOutput(writer: IResultWriterFn)
		redirectOutput(writer): CompositeCompilerHost {
			if(typeof writer == 'function')
				this._writer = writer;
			else
				this._writer = null;

			return this;
		}

		//////////////////////////////
		// private methods
		//////////////////////////////

		private _readFromStrings(filename: string, languageVersion: ts.ScriptTarget, onError?: (message: string) => void): ts.SourceFile {

			if (path.normalize(filename) === this.getDefaultLibFilename())
				return this._readFromFile(filename, languageVersion, onError);

			if (this._sources[filename])
				return ts.createSourceFile(filename, this._sources[filename], languageVersion, /*version:*/ "0");

			if(this.fallbackToFiles)
				return this._readFromFile(filename, languageVersion, onError);

			return undefined;
		}

		private _writeToString(filename: string, data: string, writeByteOrderMark: boolean, onError?: (message: string) => void) {

			this._outputs[filename] = data;

			if(this._writer)
				this._writer(filename, data, writeByteOrderMark, onError);
		}

		private _readFromFile(filename: string, languageVersion: ts.ScriptTarget, onError?: (message: string) => void): ts.SourceFile {
			try {
				var text = ts.sys.readFile(path.normalize(filename));
			}
			catch (e) {
				if (onError) {
					onError(e.message);
				}

				text = "";
			}
			return text !== undefined ? ts.createSourceFile(filename, text, languageVersion, /*version:*/ "0") : undefined;
		}

		private _writeToFile(fileName: string, data: string, writeByteOrderMark: boolean, onError?: (message: string) => void) {
			var existingDirectories: ts.Map<boolean> = {};

			function directoryExists(directoryPath: string): boolean {
				if (ts.hasProperty(existingDirectories, directoryPath)) {
					return true;
				}
				if (ts.sys.directoryExists(directoryPath)) {
					existingDirectories[directoryPath] = true;
					return true;
				}
				return false;
			}

			function ensureDirectoriesExist(directoryPath: string) {
				if (directoryPath.length > ts.getRootLength(directoryPath) && !directoryExists(directoryPath)) {
					var parentDirectory = ts.getDirectoryPath(directoryPath);
					ensureDirectoriesExist(parentDirectory);
					ts.sys.createDirectory(directoryPath);
				}
			}

			try {
				if(this._writer) {
					this._writer(fileName, data, writeByteOrderMark, onError);
				}
				else {
					ensureDirectoriesExist(ts.getDirectoryPath(ts.normalizePath(fileName)));
					ts.sys.writeFile(fileName, data, writeByteOrderMark);
				}
				this._outputs[fileName] = (writeByteOrderMark ? '\uFEFF' : '') + data;
			}
			catch (e) {
				if (onError) onError(e.message);
			}
		}
	}
}
