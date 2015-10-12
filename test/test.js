(function(){
    'use strict';

    var r2z = require('../index.js');
    var fs = require('fs');
    var assert = require('assert');
    var Promise = require('es6-promise').Promise;


	function _fileExistsSync(p) {
  		try {
  			return fs.statSync(p);
  		} catch(e){
  			return false;
  		}
  	}

    function _delete(file) {
        return new Promise(function(resolve, reject) {
            fs.unlink(file, function (err) {
                if (!err) console.log('Deleted: ' + file);
                resolve();
            });
        });
    }    	


    function callTest1(){
        console.info('Start 1...');
        return new Promise(function(resolve, reject) {
			var rarFile = 'test/abc.rar'; // 'test/abc.rar'
			var options = {
				tmpDir: "test/out",
				execUnrarTemplate: "UnRAR x \"%s\" \"%s\"",
				execZipTemplate : "7za a -r -tzip -mx0 \"%s\" \".\\%s\\*\"  ",
				zipSuffix : 'zip',
				skipIfZipAlreadyExists: false,
				beforeCleanup: function(sourceFile, targetFile, tempDir){
					console.log('Before cleanup');
				}
			};
			var callback = function(err, targetFile){
				if (err) reject(err);
				resolve('targetFile', targetFile);
			};  
			r2z.convert(rarFile, options, callback);          
        });
    }	

    callTest1()
    .then(function(){
    	assert.ok(_fileExistsSync('test/abc.cbz'));
    })    
    .then(function(){
    	_delete('test/abc.zip');
    })

})();    