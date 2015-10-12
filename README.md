# rar-to-zip

rar-to-zip is a batch rar file to zip file converter. 
It was written for converting tons of cbr comic files to [CBZ](http://wiki.mobileread.com/wiki/CBR_and_CBZ).

I don't want to kick off an discussion about CBR vs CBZ:
I know, that RAR has a slightly better compression rate than ZIP.
But I see an advantage in the possibillity of extracting single files from an zip
(extracting the first picture as cover or an meta data xml file and so on).
Also the support of zip seems to be better, especially in Java/Android.

In this tool neither unrar nor zip is implemented in JavaScript.
The "[exec command](https://nodejs.org/api/child_process.html#child_process_child_process_exec_command_options_callback)"
of [node.js](nodejs.org) is used to call a function on your system.
You must have an unrar and a zip tool in the path (or in the same directory of your node app).

## Preparation / installation

You system mut have an unrar and a zip utility. Here you will find the nessesary information for an installation:

System   | Tool  | Comment
-------- | ------|------------------------------------------------
Windows  | Unrar | [UnRAR for Windows](http://www.rarlab.com/rar_add.htm): Command line freeware Windows UnRAR.
Windows  | Zip   | [7za.exe](http://www.7-zip.de/download.html): 7-Zip für 32-bit Windows (See also [7-Zip command line examples](http://www.dotnetperls.com/7-zip-examples))
Mac OS X | Unrar | See [Install command line RAR and UnRAR tools on Mac OS X](http://best-mac-tips.com/2013/02/01/install-free-command-line-unrar-mac/)
Mac OS X | Zip   | Zip is already preinstalled on Mac OS X, since OSX based on Unix. See [zip manual page](https://developer.apple.com/library/mac/documentation/Darwin/Reference/ManPages/man1/zip.1.html)

## Usage as script

### Single Mode
```js
var r2z = require('rar-to-zip'); 
r2z.convert(rarFile, options, callback);
```

### Single Mode Example
```js
var r2z = require('./index.js');
var options = {
    tmpDir: "out",

    // Windows:
    //execUnrarTemplate: "UnRAR x \"%s\" \"%s\"",
    //execZipTemplate : "7za.exe a -r -tzip -mx0 \"%s\" \"%s\"",

    // Mac OS X:
    execUnrarTemplate: "unrar x \"%s\" \"%s\"",
    execZipTemplate : "zip -r -0  %s %s",

    zipSuffix : 'cbz',
    skipIfZipAlreadyExists: false,
    beforeCleanup: function(sourceFile, targetFile, tempDir){
        console.log('Before cleanup');
    }
};
var callback = function(err, newfile){
    if (err) return console.error('Error:', err);
    console.info('Created:', newfile);
};
r2z.convert('test/abc.rar', options, callback);
```

### Glob Mode
```js
var r2z = require('rar-to-zip'); 
r2z.convertByGlob(pattern, options, callback);
```
### Glob Mode Example
```js
var r2z = require('./index.js');
var options = {
    tmpDir: "out",

    // Windows:
    //execUnrarTemplate: "UnRAR x \"%s\" \"%s\"",
    //execZipTemplate : "7za.exe a -r -tzip -mx0 \"%s\" \"%s\"",

    // Mac OS X:
    execUnrarTemplate: "unrar x \"%s\" \"%s\"",
    execZipTemplate : "zip -r -0  %s %s",

    zipSuffix : 'cbz',
    skipIfZipAlreadyExists: false
};
r2z.convertByGlob('test/**/*.*r', options, null);
```

Information about glob file pattern can be found here: [Glob Primer](www.npmjs.com/package/glob#glob-primer).

### Options

Key    | Possible values       | Comment
------ | ----------------------|---------------------
silent | true / false (default) | true will skip logging (except errors)
tmpDir | \<String> path to tmp dir | if null, tmp dir will created automatically
execUnrarTemplate | \<String> | Template for exec command.  Depends of used unrar util. Sample: 'UnRAR x "%s" "%s" ' (Windows)  or 'unrar x "%s" "%s" ' (Mac)
unrarEscapeSpaceInFileName | true / false (default)  | if true, space characters in the two path/file names for the exec call will be escapes: "a b.rar" -> "a\ b.rar"
execZipTemplate | \<String> | Template for exec command.  Depends of used zip util.  Examples:  '7za.exe a -r -tzip -mx0 "%s" '%s" ' (Windows)  or 'zip -r -0  %s %s ' (Mac)
zipEscapeSpaceInFileName | true / false (default)  |   default: Mac or Linux (true), windows (false)
zipSuffix | \<String> | Suffix of the target file:  "cbz"  :  "abc.cbr" -> "abc.cbz"
beforeCleanup | \<function>  |  will be called before the temp directory is cleaned.  function(sourceFile, targetFile, tempDir){}
skipIfZipAlreadyExists | true / false (default  |  If true, an existing file will not be overwritten.


### Usage as CLI

```
// Display help for CLI:
node node_modules/rar-to-zip/index.js -h

// Explicit mode:
node node_modules/rar-to-zip/index.js -f test/abc.rar
node node_modules/rar-to-zip/index.js -f test/abc.rar -t out -Z "7za.exe a -r -tzip -mx0 \"%s\" \"%s\""

// glob mode:
node node_modules/rar-to-zip/index.js -g -p /Volumes/2TB/comics/**/*.*r -s cbr
node node_modules/rar-to-zip/index.js -g -p test/**/*.??r -t out -Z "7za.exe a -r -tzip -mx0 \"%s\" \"%s\""
```


