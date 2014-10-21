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

        while (lines[i].indexOf('}') >= 0) {
            i--;
        }

        // commenting call to batch.batchCompile()
        // limiting the search to the last 10 lines
        for(var j = 1; j <= 10; j++) {
            if(lines[lines.length - j].indexOf('batch') >= 0
              || lines[lines.length - j].indexOf('ts.executeCommandLine') >= 0) {
                lines[lines.length - j] = '//'+lines[lines.length - j];
            }
        }

        var tscSourceWithoutLastLines = lines.slice(0, i + 1).join('\n');

        // Create a new file, wrapping the original in a closure
        var content = "(function() { \n";
        content += tscSourceWithoutLastLines;
        content += "\n";

        // Export the base TypeScript module and
        // IO and BatchCompiler to expose the command line
        // compiler
        content += 'module.exports.ts = ts;\n';
        content += 'module.exports.sys = sys;\n';
        //content += 'module.exports.IO = TypeScript.IO;\n\n';
        //content += 'module.exports.BatchCompiler = TypeScript.BatchCompiler;\n\n';
        content += '})();\n';

        fs.writeFileSync(targetFile, content, 'utf8');
    }

    var tsc = require(targetFile);

    module.exports.ts = tsc.ts;
    module.exports.sys = tsc.sys;
    module.exports.libdPath = path.join(tsBinDir, 'lib.d.ts');

    tsc.sys.exit = function(code) { return code; };

    module.exports.compile = function (files, tscArgs) {
        var newArgs;
        var noLib = '--noLib';

        if(typeof tscArgs == "string")
            newArgs = tscArgs.split(' ');
        else
          newArgs = tscArgs || [];

        if (newArgs.indexOf(noLib) < 0) {
            newArgs.push(module.exports.libdPath);
        }
        else
            newArgs.push(noLib);

        if(!_.isArray(files))
            files = [files];

        newArgs = newArgs.concat(files);

        return tsc.ts.executeCommandLine(newArgs);
    };
})();
