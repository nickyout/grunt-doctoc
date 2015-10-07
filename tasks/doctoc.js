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
			recursivePath = '',
			args = [path.resolve( __dirname, '..', 'node_modules', 'doctoc', 'doctoc.js' ), filePath];

		// if repo root is recursive root, we need to prepend just a single slash to the path
		// otherwise, prepend a formatted recursiveDirRoot to the path
		if ( './' === recursiveDirRoot ) {
			recursivePath = '/';
		} else {

			// not sure this will be an issue, but we might as well account for this situation
			if ( '../' === recursiveDirRoot.substring( 0, 3 ) ) {
				grunt.log.warn( "Paths beginning with \"../\" may cause unforeseen issues." );
				grunt.log.warn( "For best results, this value should begin with either ./ or  no special characters" );
			}

			// if there is a leading "./" (i.e. if the first two chars in the path are "./"), remove the "."
			// other wise make just have to mke sure the leading char is a slash
			if ( './' === recursiveDirRoot.substring( 0, 2 )  ) {
				recursivePath = recursiveDirRoot.replace( /\./, "" );
			} else {
				recursivePath = recursiveDirRoot;

				// if the string doesn't have a leading slash, we need to prepend one.
				if ( '/' != recursiveDirRoot.substring( 0, 1 ) ) {
					recursivePath = '/' + recursivePath;
				}
			}
		}

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

				// Maybe there should be an option to match just "README.md" in recursive mode?
				dir.readFiles( recursiveDirRoot, {
						match: /.*\.md/,
						excludeDir: excludedDirs
					},
					function( err, content, filename, next ) {
						if ( err ) {
							throw err;
						}
						// if we have a match, add that filename (path is included) to our array of relative links
						newLinks.push( recursivePath + filename );
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
