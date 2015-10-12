(function(){
    'use strict';

	var r2z = require('./index.js');

	var pattern = '/Volumes/2TB/jdownload/__todo comics/**/*.*r';
	var options = {
		//tmpDir: "out",
        tmpDir: "/Volumes/ramdisk/out",

		// Windows:
		//execUnrarTemplate: "UnRAR x \"%s\" \"%s\"",
		//execZipTemplate : "7za.exe a -r -tzip -mx0 \"%s\" \".\\%s\\*\"  ",

		// Mac OS X:
		execUnrarTemplate: "unrar x \"%s\" \"%s\"",
		execZipTemplate : "zip -r -0  %s %s ",

		zipSuffix : 'cbz',
		skipIfZipAlreadyExists: false,
		beforeCleanup: function(sourceFile, targetFile, tempDir){
			console.log('Before cleanup');
		}
	};
	var callback = null;

	r2z.convertByGlob(pattern, options, callback);

})();   
