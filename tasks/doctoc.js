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
				recursiveDir: "./",
				relHeader: ""
			}),
			done = this.async(),
			filePath = options.target,
			themeRoot = options.recursiveDir,
			relativeLinksHeader = options.relHeader,
			newLinks = [],
			args = [path.resolve( __dirname, '..', 'node_modules', 'doctoc', 'doctoc.js' ), filePath];

		if (options.bitbucket) {
			args.push("--bitbucket");
		}

		if (grunt.file.exists(filePath)) {

			if ( themeRoot ) {
				var dir = require( 'node-dir' );
				// TODO make excludeDir an options array
				dir.readFiles( themeRoot, {
						match: /README.md/,
						excludeDir: /(node_modules|bower_components)/
					},
					function( err, content, filename, next ) {
						if ( err ) {
							throw err;
						}
						newLinks.push( filename );
						next();
					},
					function( err, files){
						if ( err ) {
							throw err;
						}
						grunt.log.writeln( "finished reading files:" + files );
					} );
			}

			grunt.util.spawn( { cmd: process.execPath, args: args }, function( error, result, code ) {

				if ( ! error ) {

					var fileStr = grunt.file.read( filePath ),
						strToReplace = "**Table of Contents**" + (options.removeAd ? "  *generated with [DocToc](http://doctoc.herokuapp.com/)*" : ""),
						endStrToc = "<!-- END doctoc generated TOC please keep comment here to allow auto update -->";

					// replace header with header options
					fileStr = fileStr.replace( strToReplace, options.header );

					// build the links for external files
					var linksCount = newLinks.length;
					if ( linksCount > 0 ) {
						for ( var i = 0; i < linksCount; i ++ ) {
							newLinks[i] = "- [" + newLinks[i] + "](" + newLinks[i] + ")";
						}

						// add relative links header if one was present in options
						if ( relativeLinksHeader ) {
							newLinks.unshift( relativeLinksHeader );
						}

						// append important end of doctoc string to array containing new links
						// pushing empty value so that the end of the toc is separated by two line returns instead of one
						newLinks.push( "" );
						newLinks.push( endStrToc );

						// array to string
						newLinks = newLinks.join( grunt.util.linefeed );

						// replace the end of the doctoc generated output with the new relative links
						fileStr = fileStr.replace( endStrToc, newLinks );
					}

					// write the files
					grunt.file.write( filePath, fileStr );

					// success msg
					grunt.log.writeln( "Added toc to " + filePath );

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
