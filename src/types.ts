/// <reference path="typescript/src/compiler/types.ts"/>

module tsc {

	export enum SourceType { File, String }

	export interface Source {
		type: SourceType;
		filename?: string;
		contents?: string;
	}

	export class StringSource implements Source {
		private static _counter = 0;

		type: SourceType = SourceType.String;

		constructor(public contents: string, public filename: string = StringSource._nextFilename()) {
		}

		private static _nextFilename() {
			return "input_string" + (++StringSource._counter) + '.ts';
		}

		resetCounter() {
			StringSource._counter = 0;
		}
	}

	export class FileSource implements Source {
		type: SourceType = SourceType.File;

		constructor(public filename: string) {
		}
	}

	export interface CompilationResult {
		sources: { [index: string]: string };
		sourceMaps: {};
		errors: string[];
	}

	export interface CompilerOptions {
		fullTypeCheckMode?: boolean;
	}

	export interface ISourceReaderFn {
		(filename: string, languageVersion?: ts.ScriptTarget, onError?: (message: string) => void): ts.SourceFile;
	}

	export interface IResultWriterFn {
		(filename: string, data: string, writeByteOrderMark?: boolean, onError?: (message: string) => void);
	}
}