var browser: Browser = browser || chrome;

document.getElementById('cancelButton').addEventListener('click', () => {
    browser.runtime.sendMessage({ acceptClicked: false }, () => { });
})
document.getElementById('acceptButton').addEventListener('click', () => {
    browser.runtime.sendMessage({ acceptClicked: true }, () => { });
})