node import-data.js
cd extension
del ..\ShinigamiEyes.xpi -ErrorAction Ignore
7z a ..\ShinigamiEyes.xpi * -mm=Copy
cd ..

