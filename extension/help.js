var browser = browser || chrome;

document.getElementById('cancelButton').addEventListener('click', () => {

    browser.runtime.sendMessage({ acceptClicked: false }, response => { });
})
document.getElementById('acceptButton').addEventListener('click', () => {

    browser.runtime.sendMessage({ acceptClicked: true }, response => { });
})