var endStrToc = "<!-- END doctoc generated TOC please keep comment here to allow auto update -->",
	replaceHeader = "**Table of Contents**",
	replaceHeaderWithAd = "**Table of Contents**  *generated with [DocToc](http://doctoc.herokuapp.com/)*",
	path = require('path');

/**
 * Description of the options object.
 * @typedef {Object} Options
 * @prop {string} target - path to file to apply doctoc to
 * @prop {boolean} [bitbucket=false] - tell doctoc to create a bitbucket-style TOC
 * @prop {boolean} [removeAd=true] - remove the link to the creator of doctoc in the generated TOC header.
 * @prop {string} [header] - replace the default header with this string.
 * @prop {string|Array.<string>} [listFiles=null] - append the TOC with this list of files. Resolves globbing patterns.
 * @prop {string} [listFilesHeader] - replace the default file list header with this string.
 */

/**
 * Run the doctoc script.
 * @param {Grunt} grunt
 * @param {string} filePath - target file for the doctoc script.
 * @param {boolean} bitbucket
 * @param {function(error, result)} callback - node style callback.
 */
function runDocToc(grunt, filePath, bitbucket, callback) {

	var doctocScript = path.resolve( __dirname, '..', 'node_modules', 'doctoc', 'doctoc.js' ),
		command = [doctocScript, filePath];

	if ( bitbucket ) {
		command.push( "--bitbucket" );
	}

	if ( grunt.file.exists( filePath ) ) {
		grunt.util.spawn({
			cmd: process.execPath,
			args: command
		}, callback);
	} else {
		callback(new Error("Could not apply doctoc: target " + filePath + " does not exist"), null);
	}
}

/**
 * Resolves a globbing pattern/array of patterns;
 * Creates an md-style list of links out of the files;
 * Appends the resulting text as separate lines to the argument `lines`
 * @param {Grunt} grunt
 * @param {Array.<string>} lines
 * @param {string|Array.<string>} listFiles - globbing pattern fed to grunt.file.expand
 * @param listFilesHeader - header.
 * @returns {Array.<string>}
 */
function appendFileList(grunt, lines, listFiles, listFilesHeader) {
	var filePaths = grunt.file.expand(listFiles),
		i;
	// add relative links header to the beginning of our array containing relative links
	if ( listFilesHeader ) {
		lines.push( listFilesHeader );
	}

	// Proper md needs a white line between and after a list
	lines.push( "" );

	for ( i = 0; i < filePaths.length; i ++ ) {
		lines.push("- [" + filePaths[i] + "](" + filePaths[i] + ")");
	}

	// Yeah, conform to doctoc output, end with empty line
	lines.push( "" );

	return lines;
}

/**
 * Performs all kinds of magic adjustments to the target file after it has been digested by the doctoc script.
 * @param {Grunt} grunt
 * @param {Options} options
 */
function adjustTOCFile(grunt, options) {
	var targetFile = options.target,
		fileContent = grunt.file.read( targetFile ),
		replacer = options.removeAd ? replaceHeaderWithAd : replaceHeader,
		linesToAppend;

	// replace ToC header with header from options
	fileContent = fileContent.replace( replacer, options.header );

	// build the links for external files
	if ( options.listFiles ) {
		linesToAppend = [];

		appendFileList(grunt, linesToAppend, options.listFiles, options.listFilesHeader);

		// append important "end of doctoc" string to array containing relative links -- this needs to be the last thing that the ToC outputs
		linesToAppend.push( endStrToc );

		// replace the end of the doctoc generated output with the new relative links
		fileContent = fileContent.replace( endStrToc, linesToAppend.join( grunt.util.linefeed ) );
	}

	// write the file
	grunt.file.write( targetFile, fileContent );

	// success msg
	grunt.log.success( "Added toc to " + targetFile );
}

module.exports = function( grunt ) {
	// Do grunt-related things in here
	grunt.registerMultiTask( "doctoc", function() {
		var options = this.options({
				bitbucket: false,
				target: "./README.md",
				removeAd: true,
				header: "**Table of Contents**",
				listFiles: null,
				listFilesHeader: "**Nested README Files**"
			}),
			done = this.async();

		runDocToc(grunt, options.target, options.bitbucket, function (error, result) {
			if (!error) {
				adjustTOCFile(grunt, options);
			} else {
				grunt.fail.fatal(error);
			}
			done();
		});
	});
};
