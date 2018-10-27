var browser = browser || chrome;


var overrides = null;

var accepted = false;
var installationId = null;
browser.storage.local.get(['overrides', 'accepted', 'installationId'], v => {
    accepted = v.accepted
    overrides = v.overrides || {}
    if(!v.installationId){
        installationId = (Math.random()+ '.' +Math.random() + '.' +Math.random()).replace(/\./g, '');
        browser.storage.local.set({installationId: installationId});
    }
})

var bloomFilters = [];

function loadBloomFilter(name) {

    var url = browser.extension.getURL('data/' + name + '.dat');
    fetch(url).then(response => {
        response.arrayBuffer().then(arrayBuffer => {
            var array = new Uint32Array(arrayBuffer);
            var b = new BloomFilter(array, 17);
            b.name = name;
            bloomFilters.push(b);
        });
    });
}



browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if(message.acceptClicked !== undefined) {
        accepted = message.acceptClicked;
        browser.storage.local.set({accepted: accepted});
        browser.tabs.remove(sender.tab.id);
        if(accepted && uncommittedResponse)
            saveLabel(uncommittedResponse)
        uncommittedResponse = null;
        return;
    }
    var response = {};
    var transphobic = message.myself && bloomFilters.filter(x => x.name == 'transphobic')[0].test(message.myself);
    for (var id of message.ids) {
        if (overrides[id] !== undefined) {
            response[id] = overrides[id];
            continue;
        }
        if (transphobic) {
            if (id == message.myself) continue;
            var sum = 0;
            for(var i = 0; i < id.length; i++){
                sum += id.charCodeAt(i);
            }
            if(sum % 8 != 0) continue;
        }
        for (var bloomFilter of bloomFilters) {
            if (bloomFilter.test(id)) response[id] = bloomFilter.name;
        }
    }
    sendResponse(response);
});

loadBloomFilter('transphobic');
loadBloomFilter('t-friendly');



function createContextMenu(text, id) {
    browser.contextMenus.create({
        id: id,
        title: text,
        contexts: ["link"],
        targetUrlPatterns: [
            "*://*.facebook.com/*",
            "*://*.youtube.com/*",
            "*://*.reddit.com/*",
            "*://*.twitter.com/*"
        ]
    });
}

createContextMenu('Mark as anti-trans', 'mark-transphobic');
createContextMenu('Mark as t-friendly', 'mark-t-friendly');
createContextMenu('Clear', 'mark-none');
createContextMenu('Help', 'help');

var uncommittedResponse = null;

function saveLabel(response){
    if(accepted){
        overrides[response.identifier] = response.mark;
        browser.storage.local.set({overrides: overrides})
        //console.log(response);
        browser.tabs.sendMessage(response.tabId, { updateAllLabels: true });
        //browser.tabs.executeScript(response.tabId, {code: 'updateAllLabels()'});
        return;
    }
    uncommittedResponse = response;
    openHelp();
}

function openHelp(){
    browser.tabs.create({
        url: browser.extension.getURL('help.html')
    })
}

browser.contextMenus.onClicked.addListener(function (info, tab) {
    if(info.menuItemId == 'help'){
        openHelp();
        return;
    }

    var label = info.menuItemId.substring('mark-'.length);
    if(label == 'none') label = '';
    browser.tabs.sendMessage(tab.id, {
        mark: label,
        url: info.linkUrl,
        elementId: info.targetElementId
    }, null, response => {
        if (!response.identifier) return;
        response.tabId = tab.id;
        saveLabel(response);
    })

});
