module.exports = function(grunt) {
	var child_process = require("child_process"),
		path = require("path");
	// Do grunt-related things in here
	grunt.registerMultiTask("doctoc", function() {
		var options = this.options({
				bitbucket: false,
				target: "./README.md",
				removeAd: true,
				header: "**Table of Contents**"
			}),
			done = this.async(),
			filePath = options.target,
			args = [path.resolve(__dirname, '..','node_modules','doctoc','doctoc.js'), filePath];

		if (options.bitbucket) {
			args.push("--bitbucket");
		}
		if (grunt.file.exists(filePath)) {
		grunt.util.spawn({ cmd: "nodejs", args: args }, function(error, result, code) {

			if (!error) {
			
				var fileStr = grunt.file.read(filePath),
					strToReplace = "**Table of Contents**" + (options.removeAd ? "  *generated with [DocToc](http://doctoc.herokuapp.com/)*" : "");
	
				fileStr = fileStr.replace(strToReplace, options.header);
				grunt.file.write(filePath, fileStr);
				grunt.log.writeln("Added toc to " + filePath);
			} else {
				grunt.fail.fatal(error);
				grunt.log.error("Failed to apply toc to " + filePath);
			}
			done();
		});
		} else {
			grunt.fail.warn("Target " + filePath + " does not exist");	
			done();
		}
	});

};
