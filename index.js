
(function () {
    'use strict';

	var fs = require('fs');
	var util = require('util');
	var path = require('path');

	var child_process = require('child_process');
	var exec  = child_process.exec;

    var os = require('os');

    var program = require('commander');
    var glob = require("glob");
    var tmp = require('tmp');
	var log = require('npmlog');
	var mkdirp = require('mkdirp');

	module.exports = rar2Zip.convert = rar2Zip;

	rar2Zip.convert = function convert(rarFile, options, callback) {
		var tmpobj = null;
	    var tmpDir = options.tmpDir;
	    var zipFileName = null;



		/**
		 * Removes true if OS is Mac OS X or Linux.
		 *
		 * @api private
		 */
	  	function isMacOrLinux() {
            return os.type() === 'Linux'|| os.type() === 'Darwin';
	  	} // isMacOrLinux


		/**
		 * Removes files and folders in a directory recursively.
		 *
		 * @api private
		 */
	  	function _cleanTmpDirectory() {
			// remove tmp directory:
			if (tmpobj) {
				tmpobj.removeCallback();
			} else {
				_rmdirRecursiveSync(tmpDir);
			}
			if (!options.silent) log.info('r2z',  'Tmp directory deleted: %s', tmpDir);
	  	} // _cleanTmpDirectory


		/**
		 * Creates a clean tmp directory.
		 * If a given directory exists, it will be cleaned.
		 *
		 * @api private
		 */
	  	function _createTmpDirectory (){
			if (!tmpDir) {
				tmpobj = tmp.dirSync();
				tmpDir = tmpobj.name;

			} else {
				if (_fileExistsSync(tmpDir)) {
					_rmdirRecursiveSync(tmpDir);
				}
				mkdirp.sync(tmpDir, {});
			}
			if (!options.silent) log.info('r2z',  'Tmp directory created: %s', tmpDir);
	  	} // _createTmpDirectory 	



		/**
		 * Checks if a given directory or file exists.
		 *
		 * @param {String} p
		 * @return {boolean}
		 * @api private
		 */
	  	function _fileExistsSync(p) {
	  		try {
	  			return fs.statSync(p);
	  		} catch(e){
	  			return false;
	  		}
	  	} // _fileExistsSync 

		/**
		 * Removes files and folders in a directory recursively.
		 * The directory will be removed itself too.
		 *
		 * @param {String} root
		 * @api private
		 */
	  	function _rmdirRecursiveSync(root) {
	  		var dirs = [root];

	  		do {
	  			var dir = dirs.pop();
	  			var deferred = false;
	  			var files = fs.readdirSync(dir);

	  			for (var i = 0, length = files.length; i < length; i++) {
	  				var file = path.join(dir, files[i]);
	        		var stat = fs.lstatSync(file); 

			        if (stat.isDirectory()) {
			        	if (!deferred) {
			        		deferred = true;
			        		dirs.push(dir);
			        	}  
			        	dirs.push(file);
			        } else {
			        	fs.unlinkSync(file);
			        }
			    }

			    if (!deferred) {
			    	fs.rmdirSync(dir);
			    }
			} while (dirs.length !== 0);
		} // _rmdirRecursiveSync	


        function getFileName(s, escape){
            if (path.sep === '/') {
                s = s.replace(/\\/g, '/');
            } else {
                s = s.replace(/\//g, '\\');
            }
            if (escape) s = s.replace(/ /g, '\\ ');

            return s;
        }

		/**
		 * Main function
		 *
		 * @api private
		 */
		function _start() {

            if (!rarFile) rarFile = options.rarFile;
            if (!rarFile) return log.error('r2z',"Error: rarFile or options.rarFile missing.");

			var callb = callback ? callback : function(err, newfile){
				if (err) return log.error('r2z', 'Error:', err);
				if (!options.silent) log.info('r2z', 'Created', newfile);
			};

			if (!options.beforeCleanup) options.beforeCleanup = function(sourceFile, targetFile, tempDir){};

            if (options.unrarEscapeSpaceInFileName === undefined) options.unrarEscapeSpaceInFileName = false;
            if (options.zipEscapeSpaceInFileName === undefined) options.zipEscapeSpaceInFileName = isMacOrLinux();

			var skipIfZipAlreadyExists =  options.skipIfZipAlreadyExists;
			if (skipIfZipAlreadyExists === undefined) skipIfZipAlreadyExists = true;

		    var execUnrarTemplate = options.execUnrarTemplate ? options.execUnrarTemplate : "unrar x \"%s\" \"%s\"";
			var execZipTemplate = options.execZipTemplate ? options.execZipTemplate : "zip -r -0  %s %s ";
			var zipSuffix = options.zipSuffix ? options.zipSuffix : 'zip';

			zipFileName = path.basename(rarFile, path.extname(rarFile)) + '.' + zipSuffix;
			zipFileName = path.join(path.dirname(rarFile), zipFileName);
            var tempZip = path.join(path.dirname(rarFile), 'o.zip');
		    
			if (_fileExistsSync(zipFileName)) {
				if (skipIfZipAlreadyExists) {
					return callb('Abort: Target file already exists.', zipFileName); 
				}

				try {
					fs.unlinkSync(zipFileName);
				} catch(e) {
					callb('Error: Cannot delete ' + zipFileName, null); 
				}
			}

		  	_createTmpDirectory();


		  	var execUnrarCommand = util.format(execUnrarTemplate,
                getFileName(rarFile, options.unrarEscapeSpaceInFileName),
                getFileName(tmpDir, options.unrarEscapeSpaceInFileName));

			var execZipCommand = util.format(execZipTemplate,
                getFileName(tempZip, options.zipEscapeSpaceInFileName),
                getFileName(path.join(tmpDir, '*'), options.zipEscapeSpaceInFileName));

			if (!options.silent) {
                log.info('r2z', 'execUnrarCommand',  execUnrarCommand);
                log.info('r2z', 'execZipCommand',  execZipCommand);
            }

		  	// Unrar source dir:
		  	exec(execUnrarCommand, function (err, stdout, stderr) {
		  		
		  		if (err) {
		  			_cleanTmpDirectory();
		  			return callb(err, null);
		  		}

		  		if (stdout.length > 0 && stdout.match(/.*not RAR archive.*/g)) { 
		  			_cleanTmpDirectory();
		  			return callb('Unsupported RAR.', null); 
		  		}

                if (!options.silent) log.info('r2z',  stdout);


		  		// Zip the directory tmpDir:
				exec(execZipCommand, function (err, stdout, stderr) {	  		
			  		if (err) {
                        log.error('r2z', err);
			  			_cleanTmpDirectory();
			  			return callb('Error ' + err, null);
	  			  	}

                    if (!options.silent) log.info('r2z',  stdout);

			  		try {
                        fs.renameSync(tempZip, zipFileName);

                        options.beforeCleanup(rarFile, zipFileName, tmpDir);
                        _cleanTmpDirectory();
                        if (!options.silent) log.info('r2z',  'Done', zipFileName);
                        callb(null, zipFileName);

			  		} catch(e) {
                        _cleanTmpDirectory();
                        if (!options.silent) log.error('r2z',  'Error: ' + e, zipFileName);
                        callb("Could not move " + tempZip + " to " + zipFileName + '\n' + e, null);
		  			}
		  		});
		  	});
		}

		_start();		
	};

	rar2Zip.convertByGlob = function convertByGlob(pattern, options, callback) {
        if (!options.silent) log.info('r2z', 'rar2Zip.convertByGlob...');

        if (!pattern) options.filePattern;
        if (!pattern) return log.error('r2z',"Error: pattern or options.filePattern missing.");

		var callb = callback ? callback : function(err, newfile){
				if (err) return log.error('r2z', 'Error:', err);
				if (!options.silent) log.info('r2z', 'Created', newfile);
			};        


        glob(pattern, {}, function (err, files) {

		    function _nextTodo() {
		    	if (todoIdx < todos.length) {
		    		todos[todoIdx++](function(err, newfile){
                        if (!err) newfiles.push(newfile);
		    			_nextTodo();
		    		});
		    	} else {
		    		callb(null, newfiles);
		    	}
		    }

		    function _createTodo(rarFile) {
		        return function (cb) {
		        	if (!options.silent) log.info('r2z',"    File: " + rarFile);
		        	rar2Zip.convert(rarFile, options, cb);
		        };
		    }		    

            if (err) return callback(err, "Error: Cannot read " + pattern);
            if (!options.silent) log.info('r2z','    Files found: ' + files.length);

            var newfiles = [];
            var todos = [];
            var todoIdx = 0;
            for (var i = 0; i < files.length; i++) {
                todos.push(_createTodo(files[i]));
            }

		    _nextTodo();
        });        
	};


	rar2Zip();

	function rar2Zip(){
        console.log('r a r 2 Z i p  ( )');
        console.log(process.argv);

        // check, if there is a command call like:   node node_modules/rar-to-zip/index.js -g -p /Volumes/2TB/comics/**/*.*r -s cbr
        program
            .version('0.0.1')
            .option('-p, --filePattern [filePattern]', 'Specify glob pattern [**/*.rar]', '**/*.rar')
            .option('-g, --glob', 'Set glob mode')
            .option('-f, --rarFile [rarFile]', 'Specify rarFile [abc.rar]', null)
            .option('-s, --zipSuffix [zip]', 'Specify the file suffix of the target file [zip]', 'zip')
            .option('-t, --tmpDir [tmp]', 'Specify the temp directory [tmp]', null)

            .option('-x, --skip', 'Skip convert if target file already exists')

            .option('-u, --unrarEscapeSpaceInFileName', 'Set escaping space in file name for unrar exec command')
            .option('-z, --zipEscapeSpaceInFileName', 'Set escaping space in file name for zip exec command')

            .option('-U, --execUnrarTemplate [execUnrarTemplate]', 'Specify glob pattern [unrar x "%s" "%s"]', 'unrar x "%s" "%s"')
            .option('-Z, --execZipTemplate [execZipTemplate]', 'Specify glob pattern [zip -r -0  %s %s]', 'zip -r -0  %s %s')

            .option('-s, --silent', 'Set silent mode')
            .parse(process.argv);

        var options = {
            silent: program.silent,
            skipIfZipAlreadyExists: program.skip,
            zipSuffix: program.zipSuffix,
            tmpDir: program.tmpDir,
            execUnrarTemplate: program.execUnrarTemplate,
            execZipTemplate: program.execZipTemplate,
        };
        if (program.unrarEscapeSpaceInFileName !== undefined) options.unrarEscapeSpaceInFileName= program.unrarEscapeSpaceInFileName;
        if (program.zipEscapeSpaceInFileName !== undefined) options.zipEscapeSpaceInFileName= program.zipEscapeSpaceInFileName;

        console.log('options', options);

        if (program.glob) {
            rar2Zip.convertByGlob(program.filePattern, options, null);

        } else if (program.rarFile) {
            rar2Zip.convert(program.rarFile, options, null);
        } else {
            // no CLI mode
        }

	}


})();