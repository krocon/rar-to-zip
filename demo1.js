(function(){
    'use strict';

	var r2z = require('./index.js');

	var rarFile = 'test/abc.rar';
	var options = {
		tmpDir: "/Volumes/ramdisk/out",
		//tmpDir: "out",

        // Windows:
		//execUnrarTemplate: "UnRAR x \"%s\" \"%s\"",
		//execZipTemplate : "7za.exe a -r -tzip -mx0 \"%s\" \"%s\"  ",

        // Mac OS X:
        execUnrarTemplate: "unrar x \"%s\" \"%s\"",
        unrarEscapeSpaceInFileName: false,

        execZipTemplate : "zip -r -0 %s %s ",
        zipEscapeSpaceInFileName: true,

		zipSuffix : 'cbz',
		skipIfZipAlreadyExists: false,
		beforeCleanup: function(sourceFile, targetFile, tempDir){
			console.log('Before cleanup');
		}
	};
	var callback = null;

	r2z.convert(rarFile, options, callback);

})();   

/*
Mac OS X:
    http://www.rarlab.com/download.htm
    http://best-mac-tips.com/2013/02/01/install-free-command-line-unrar-mac/

    sudo mkdir -p /usr/local/bin

    sudo install -c -o $USER unrar /usr/local/bin
    sudo install -c -o $USER rar /usr/local/bin

Windows:
	http://www.rarlab.com/
	https://www.feralhosting.com/faq/view?question=36
	UnRAR x "test.rar" "out"

	https://sevenzip.osdn.jp/chm/cmdline/commands/add.htm
	7za.exe a -r -tzip -mx0 "test.cbz" ".\out\*"
*/
