$ErrorActionPreference = 'Stop'

$version = (gc .\extension\manifest.json | convertfrom-json).version
$archiveDir = "C:\ML\shinigami-eyes-releases"


$out = "$archiveDir\shinigami-eyes-$version.xpi"
if(Test-Path $out){ throw 'Release already exists.' }

node import-data.js
cd extension
del ..\ShinigamiEyes.xpi -ErrorAction Ignore
7z a ..\ShinigamiEyes.xpi * -mm=Copy
cd ..


copy ShinigamiEyes.xpi $out
7z a "$archiveDir\shinigami-eyes-lists-$version.7z" -mx9 C:\ML\facebook\decisions.pb
CheckExitCode



