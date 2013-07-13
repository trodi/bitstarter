#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
   
 + restler
   - https://github.com/danwrong/restler
*/

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var restler = require('restler');
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};

var loadCheerioFile = function(htmlfile) {
    return cheerio.load(fs.readFileSync(htmlfile));
};

var loadCheerioUrl = function(htmlUrl, checksFile) {
	var out = "";
	restler.get(htmlUrl).on('complete', function(data) {
		out = data;
		//TODO: have this path use the same code as the other
		var checkJson = checkHtml(cheerio.load(out), checksFile);
		var outJson = JSON.stringify(checkJson, null, 4);
	    console.log(outJson);
	});
	return cheerio.load(out);
}

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtml = function(html, checksFile) {
	$ = html;
    var checks = loadChecks(checksFile).sort();
    var out = {};
    for(var ii in checks) {
        var present = $(checks[ii]).length > 0;
        out[checks[ii]] = present;
    }
    return out;
};

var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

if(require.main == module) {
    program
        .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
        .option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT)
        .option('-u, --url <url>', 'URL to grade.')
        .parse(process.argv);
	//TODO: if they specify both -f and -u
    var checkJson;
    console.log("checks file: %s", program.checks);
    if (program.url) {
    	loadCheerioUrl(program.url, program.checks);
//    	checkJson = checkHtml(loadCheerioUrl(program.url), program.checks);
    } else if (program.file) {
    	checkJson = checkHtml(loadCheerioFile(program.file), program.checks);
    	var outJson = JSON.stringify(checkJson, null, 4);
        console.log(outJson);
    }
} else {
    exports.checkHtml = checkHtml;
}