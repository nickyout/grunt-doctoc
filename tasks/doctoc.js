module.exports = function( grunt ) {
	var child_process = require( "child_process" ),
		path = require( "path" );

	// Do grunt-related things in here
	grunt.registerMultiTask( "doctoc", function() {
		var options = this.options( {
				bitbucket: false,
				target: "./README.md",
				removeAd: true,
				header: "**Table of Contents**",
				recursive: false,
				excludedDirs: [],
				recursiveDirRoot: "./",
				relHeader: "**Nested README Files**"
			}),
			done = this.async(),
			filePath = options.target,
			recursive = options.recursive,
			recursiveDirRoot = options.recursiveDirRoot,
			excludedDirs = options.excludedDirs,
			relativeLinksHeader = options.relHeader,
			newLinks = [],
			args = [path.resolve( __dirname, '..', 'node_modules', 'doctoc', 'doctoc.js' ), filePath];

		if ( options.bitbucket ) {
			args.push( "--bitbucket" );
		}

		if ( grunt.file.exists( filePath ) ) {

			// if recursive mode is true
			if ( recursive ) {
				var dir = require( 'node-dir' );

				// check if excludedDirs has values (passed as an array in grunt-doctoc options)
				if ( excludedDirs.length > 0 ) {

					grunt.log.warn( "Excluded Directories: " + excludedDirs );

					// format regex
					excludedDirs = excludedDirs.join( "|" );
					excludedDirs = new RegExp( excludedDirs, "gi" );
				} else {
					// set this to a string, so we don't break our regex pattern
					excludedDirs = "";
				}

				// node-dir can iterate through file systems and pluck out all files that match README.md
				// we may want to change `match` to match any `*.md` file
				dir.readFiles( recursiveDirRoot, {
						match: /README.md/,
						excludeDir: excludedDirs
					},
					function( err, content, filename, next ) {
						if ( err ) {
							throw err;
						}
						// if we have a match, add that filename (path is included) to our array of relative links
						newLinks.push( filename );
						next();
					});
			}

			grunt.util.spawn( { cmd: process.execPath, args: args }, function( error, result, code ) {

				if ( ! error ) {

					var fileStr = grunt.file.read( filePath ),
						strToReplace = "**Table of Contents**" + ( options.removeAd ? "  *generated with [DocToc](http://doctoc.herokuapp.com/)*" : "" ),
						endStrToc = "<!-- END doctoc generated TOC please keep comment here to allow auto update -->";

					// replace ToC header with header from options
					fileStr = fileStr.replace( strToReplace, options.header );

					// build the links for external files
					var linksCount = newLinks.length;
					if ( linksCount > 0 ) {
						for ( var i = 0; i < linksCount; i ++ ) {
							newLinks[i] = "- [" + newLinks[i] + "](" + newLinks[i] + ")";
						}

						// add relative links header to the beginning of our array containing relative links
						if ( relativeLinksHeader ) {
							newLinks.unshift( relativeLinksHeader );
						}

						// pushing empty value so that the end of the toc is separated by two line returns instead of one
						newLinks.push( "" );

						// append important "end of doctoc" string to array containing relative links -- this needs to be the last thing that the ToC outputs
						newLinks.push( endStrToc );

						// formatting output to return each value on a new line
						newLinks = newLinks.join( grunt.util.linefeed );

						// replace the end of the doctoc generated output with the new relative links
						fileStr = fileStr.replace( endStrToc, newLinks );
					}

					// write the files
					grunt.file.write( filePath, fileStr );

					// success msg
					grunt.log.success( "Added toc to " + filePath );

				} else {
					grunt.fail.fatal( error );
					grunt.log.error( "Failed to apply toc to " + filePath );
				}
				done();
			} );
		} else {
			grunt.fail.warn( "Target " + filePath + " does not exist" );
			done();
		}
	} );

};
