(function() {
    var fs = require('fs');
    var _ = require('underscore');

    var tsDir = __dirname + '/node_modules/typescript/';
    var tsBinDir = tsDir + 'bin/';
    var version = JSON.parse(fs.readFileSync(tsDir + 'package.json')).version;
    var targetFile = __dirname + '/tsc-generated-' + version + '.tmp';

    if (!fs.existsSync(targetFile)) {       
        var srcFile = tsBinDir + 'tsc.js';
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
        content += 'module.exports.BatchCompiler = BatchCompiler;\n\n';   
        content += '})();\n';
        
        fs.writeFileSync(targetFile, content, 'utf8');
    }
    
    module.exports = require(targetFile);
    module.exports._libdPath = tsBinDir + 'lib.d.ts';

    var IO = module.exports.IO;
    var BatchCompiler = module.exports.BatchCompiler;

    module.exports.compile = function (files, tscArgs, onError) {
        var newArgs = tscArgs.slice(0);
        var noLib = '--nolib';
        if (tscArgs.indexOf(noLib) < 0) {
            newArgs.push(noLib);
            newArgs.push(module.exports._libdPath);
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
                    if (onError(str, includesNewline) !== false) {
                        original(str);
                    }
                };
            }

            io.stderr.Write = wrapWithCallback(io.stderr.Write, false);
            io.stderr.WriteLine = wrapWithCallback(io.stderr.WriteLine, true);
        }

        new BatchCompiler(io).batchCompile();
        return exitCode;
    };
})();