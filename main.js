(function() {
    var fs = require('fs');
    var path = require('path');
    var _ = require('underscore');
    
    var tsDir = path.join(__dirname, '/node_modules/typescript/');
    var tsBinDir = path.join(tsDir, 'bin');
    var version = JSON.parse(fs.readFileSync(path.join(tsDir, 'package.json'))).version;
    var targetFile = path.join(__dirname, '/tsc-' + version + '-wrapped.tmp');

    if (!fs.existsSync(targetFile)) {
        var srcFile = path.join(tsBinDir, 'tsc.js');
        var tscSource = fs.readFileSync(srcFile, 'utf8');

        // Remove all the "executable" lines at the end of the file
        // eg. var batchCompiler = new BatchCompiler(IO);
        //     batchCompiler.batchCompile();
        var lines = tscSource.split(/[\n\r]+/);
        var i = lines.length - 1;
        while (lines[i].indexOf('}') !== 0) {
            i--;
        }
        var tscSourceWithoutLastLines = lines.slice(0, i + 1).join('\n');
        
        // Create a new file, wrapping the original in a closure
        var content = "(function() { \n";
        content += tscSourceWithoutLastLines;
        content += "\n\n";

        // Export the base TypeScript module and 
        // IO and BatchCompiler to expose the command line
        // compiler
        content += 'module.exports = TypeScript;\n\n';
        content += 'module.exports.IO = IO;\n\n';   
        content += 'module.exports.BatchCompiler = TypeScript.BatchCompiler;\n\n';   
        content += '})();\n';
        
        fs.writeFileSync(targetFile, content, 'utf8');
    }
    
    module.exports = require(targetFile);
    module.exports.libdPath = path.join(tsBinDir, 'lib.d.ts');

    var IO = module.exports.IO;
    var BatchCompiler = module.exports.BatchCompiler;

    module.exports.compile = function (files, tscArgs, onError) {
        var newArgs;
        var noLib = '--noLib';

        if(typeof tscArgs == "string")
            newArgs = tscArgs.split(' ');
        else
        	newArgs = tscArgs || [];
        
        if (newArgs.indexOf(noLib) < 0) {
            newArgs.push(noLib);
            newArgs.push(module.exports.libdPath);
        }

        newArgs = newArgs.concat(files);

        var io = _.extend({}, IO, { arguments: newArgs });

        var exitCode;
        
        io.quit = function(code) {
            exitCode = code;
        };

        if (onError) {
            function wrapWithCallback(fn, includesNewline) {
                var original = fn;
                return function (str) {
                    if (onError(str) !== false) {
                        original(str);
                    }
                };
            }

            io.stderr.Write = wrapWithCallback(io.stderr.Write);
            io.stderr.WriteLine = wrapWithCallback(io.stderr.WriteLine);
        }

        new BatchCompiler(io).batchCompile();
        return exitCode;
    };
})();