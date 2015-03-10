/// <reference path="../typings/node/node.d.ts" />
/// <reference path="../typings/mocha/mocha.d.ts" />
/// <reference path="../typings/chai/chai.d.ts" />

import chai = require('chai');
import fs = require('fs');

var expect = chai.expect;
var tsc = require('..');

describe('typescript-compiler', () => {

	it('Should parse args from a file', () => {
		var error;
		var result = tsc.compileString(
			'export class ArgTest { public worked : boolean = true; }',
			'@test/args/commonjs.txt', null, (e) => error = e.formattedMessage);

		expect(error).to.be.empty(error);
	});

	describe('#compile', () => {

		it('should generate the same output tsc does', () => {
			var expected = fs.readFileSync('test/cases/2dArrays.js').toString();
			var result = tsc.compile('test/cases/2dArrays.ts', '--out test/tmp/2dArrays.js');

			expect(result.sources['test/tmp/2dArrays.js'].split(/[\r\n]+/)).to.deep.equal(expected.split(/[\r\n]+/));
		})

		it('should be able to compile many files at once', () => {
			// tsc -m commonjs -t ES5 test/cases/fleet.error.ts --out test/cases/navy.error.js
			var expected_output = fs.readFileSync('test/cases/navy.js').toString();

			var result = tsc.compile(['test/cases/ship.ts', 'test/cases/fleet.ts'],
				'-m commonjs -t ES5 --out test/tmp/navy.js');

			expect(result.sources['test/tmp/navy.js'].split(/[\r\n]+/)).to.deep.equal(expected_output.split(/[\r\n]+/))
			expect(result.errors.length).to.equal(0)
		})

		it('should return errors exactly like tsc', () => {
			var expected_output = fs.readFileSync('test/cases/constructorOverloads.js').toString();
			var expected_errors = fs.readFileSync('test/cases/constructorOverloads.errors').toString().trim().split('\n');
			var result = tsc.compile('test/cases/constructorOverloads.ts');

			expect(result.sources['test/cases/constructorOverloads.js'].split(/[\r\n]+/)).to.deep.equal(expected_output.split(/[\r\n]+/))
			expect(result.errors.length).to.be.equal(expected_errors.length)
			expect(result.errors[0].trim()).to.be.equal(expected_errors[0].trim())
		})

		it('should forward errors to callback', () => {
			var callbackCalled = false;
			var result = tsc.compile('test/cases/constructorOverloads.ts', null, null, (e) => {
				callbackCalled = true
			});
			expect(callbackCalled).to.be.true;
		})
	})

	describe('#compileString', () => {

		it('should generate the same output tsc does', () => {
			var source = fs.readFileSync('test/cases/2dArrays.ts').toString();
			var expected = fs.readFileSync('test/cases/2dArrays.js').toString();
			var result = tsc.compileString(source);

			expect(result.split(/[\r\n]+/)).to.deep.equal(expected.split(/[\r\n]+/));
		})

		it('should return errors exactly like tsc', () => {
			var errors = [];
			var source = fs.readFileSync('test/cases/constructorOverloads.ts').toString();
			var expected_errors = fs.readFileSync('test/cases/constructorOverloads.errors')
										.toString()
										.replace(/test\/cases\/constructorOverloads/g, 'string')
										.trim().split('\n');

			var result = tsc.compileString(source, null, null, (e) => {
				errors.push(e.formattedMessage.trim())
			});

			expect(errors).to.deep.equal(expected_errors)
		})

		it('should return an empty result when input is empty', () => {
			var result = tsc.compileString('');
			expect(result).to.be.empty;
		})

		it('should forward errors to callback', () => {
			var errorMsg = '';
			var result = tsc.compileString('var a : SomeFakeType', null, null, (e) => {
				errorMsg = e.messageText
			});
			expect(errorMsg).to.equal('Cannot find name \'SomeFakeType\'.');
		})
	})

	describe('#compileStrings', () => {

		var sources = {
			'ship.ts': 'module Navy { export class Ship { isSunk: boolean; } }',
			'fleet.ts': '///<reference path="ship.ts" />\nmodule Navy { export class Fleet { ships: Ship[] } }'
		};

		var sources_with_errors = {
			'test/cases/ship.error.ts': 'module Navy { export class Ship { isSunk: booleano; } }',
			'test/cases/fleet.error.ts': '///<reference path="ship.error.ts" />\nmodule Nav { export class Fleet { ships: Ship[] } }'
		};

		it('should generate the same output tsc does', () => {
			var result = tsc.compileStrings(sources, '-m commonjs -t ES5 --out navy.js')
			// tsc -m commonjs -t ES5 test/cases/fleet.ts --out test/cases/navy.js
			var expected_result = fs.readFileSync('test/cases/navy.js').toString();
		
			expect(result.sources['navy.js'].split(/[\r\n]+/)).to.deep.equal(expected_result.split(/[\r\n]+/));
		})

		it('should return errors exactly like tsc', () => {
			// tsc -m commonjs -t ES5 test/cases/fleet.error.ts --out test/cases/navy.error.js
			var expected_output = fs.readFileSync('test/cases/navy.error.js').toString();
			var expected_errors = fs.readFileSync('test/cases/navy.errors').toString().trim().split('\n');
			var result = tsc.compileStrings(sources_with_errors, '-m commonjs -t ES5 --out navy.js');

			expect(result.sources['navy.js'].split(/[\r\n]+/)).to.deep.equal(expected_output.split(/[\r\n]+/))
			expect(result.errors.length).to.be.equal(expected_errors.length)
			expect(result.errors[0].trim()).to.be.equal(expected_errors[0].trim())
		})

		it('should allow references between strings', () => {
			var out = tsc.compileStrings(sources, '-m commonjs --out all.js');
		})

		it('should forward errors to callback', () => {
			var callbackCount = 0;
			var result = tsc.compileStrings(sources_with_errors, null, null, (e) => {
				callbackCount++
			});
			expect(callbackCount).to.equal(2);
		})
	})
})
