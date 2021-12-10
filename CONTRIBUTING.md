# CONTRIBUTING

## Prerequisites

* Node.js
* Typescript (`npm i -g typescript`)

## Compiling

* Run `tsc` in the `extension` directory, or `tsc --watch` for auto-compilation when you make changes to the codebase

## Testing

These instructions are for Chromium-based browsers only (Chrome, Edge, Brave, Vivaldi, etc.), instructions for Firefox would be appreciated. Make sure to have compiled your code first. If using live reloading using `--watch`, you will *still* have to manually reload the extension in the Extensions window for any changes to be picked up by the browser.

* Open [chrome://extensions](chrome://extensions)
* Enable "Developer mode"
* Click "load unpacked"
* Select the `extension` directory
