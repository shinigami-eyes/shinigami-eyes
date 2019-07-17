var browser: Browser = browser || chrome;

document.getElementById('cancelButton').addEventListener('click', () => {
    browser.runtime.sendMessage(<ShinigamiEyesCommand>{ acceptClicked: false, closeCallingTab: true }, () => { });
})
document.getElementById('acceptButton').addEventListener('click', () => {
    browser.runtime.sendMessage(<ShinigamiEyesCommand>{ acceptClicked: true, closeCallingTab: true }, () => { });
})