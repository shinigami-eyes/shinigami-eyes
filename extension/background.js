var browser = browser || chrome;

var PENDING_SUBMISSIONS = ':PENDING_SUBMISSIONS'
var MIGRATION = ':MIGRATION'

// If a user labels one of these URLs, they're making a mistake. Ignore the label.
// This list includes:
// * Social networks that are not supported
// * System pages of supported social networks
// * Archival and link shortening sites.
var badIdentifiersArray = [
    'archive.is',
    'archive.org',
    'assets.tumblr.com',
    'bing.com',
    'bit.ly',
    'blogspot.com',
    'change.org',
    'curiouscat.me',
    'deviantart.com',
    'discord-store.com',
    'discordapp.com',
    'disqus.com',
    'duckduckgo.com',
    'en.wikipedia.org',
    'en.wikiquote.org',
    'etsy.com',
    'facebook.com',
    'facebook.com/a',
    'facebook.com/ad_campaign',
    'facebook.com/ads',
    'facebook.com/ajax',
    'facebook.com/bookmarks',
    'facebook.com/buddylist.php',
    'facebook.com/bugnub',
    'facebook.com/comment',
    'facebook.com/composer',
    'facebook.com/events',
    'facebook.com/findfriends',
    'facebook.com/friends',
    'facebook.com/fundraisers',
    'facebook.com/games',
    'facebook.com/groups',
    'facebook.com/hashtag',
    'facebook.com/help',
    'facebook.com/home.php',
    'facebook.com/intl',
    'facebook.com/jobs',
    'facebook.com/l.php',
    'facebook.com/language.php',
    'facebook.com/legal',
    'facebook.com/like.php',
    'facebook.com/local_surface',
    'facebook.com/logout.php',
    'facebook.com/mbasic',
    'facebook.com/menu',
    'facebook.com/messages',
    'facebook.com/nfx',
    'facebook.com/notes',
    'facebook.com/notifications.php',
    'facebook.com/notifications',
    'facebook.com/nt',
    'facebook.com/page',
    'facebook.com/pages',
    'facebook.com/people',
    'facebook.com/permalink.php',
    'facebook.com/pg',
    'facebook.com/photo.php',
    'facebook.com/policies',
    'facebook.com/privacy',
    'facebook.com/profile.php',
    'facebook.com/rapid_report',
    'facebook.com/reactions',
    'facebook.com/salegroups',
    'facebook.com/search',
    'facebook.com/settings',
    'facebook.com/sharer.php',
    'facebook.com/shares',
    'facebook.com/story.php',
    'facebook.com/ufi',
    'google.com',
    'googleusercontent.com',
    'i.imgur.com',
    'i.reddituploads.com',
    'imdb.com',
    'imgur.com',
    'instagram.com',
    'mail.google.com',
    'media.tumblr.com',
    'medium.com',
    'patreon.com',
    'paypal.com',
    'paypal.me',
    'play.google.com',
    'plus.google.com',
    'rationalwiki.org',
    'reddit.com',
    'reddit.com/r/all',
    'reddit.com/r/popular',
    'reddituploads.com',
    'removeddit.com',
    't.co',
    't.umblr.com',
    'tapatalk.com',
    'tumblr.com',
    'twitch.tv',
    'twitter.com',
    'twitter.com/hashtag',
    'twitter.com/i',
    'twitter.com/search',
    'twitter.com/settings',
    'twitter.com/threader_app',
    'twitter.com/threadreaderapp',
    'twitter.com/who_to_follow',
    'vk.com',
    'wikipedia.org',
    'wordpress.com',
    'www.tumblr.com',
    'youtu.be',
    'youtube.com',
    'youtube.com/playlist',
    'youtube.com/redirect',
    'youtube.com/watch',
];
var badIdentifiers = {};
badIdentifiersArray.forEach(x => badIdentifiers[x] = true);


var overrides = null;

var accepted = false;
var installationId = null;

browser.storage.local.get(['overrides', 'accepted', 'installationId'], v => {
    accepted = v.accepted
    overrides = v.overrides || {}

    var migration = overrides[MIGRATION] || 0;
    var CURRENT_VERSION = 9;
    if(migration < CURRENT_VERSION){

        for(var key of Object.getOwnPropertyNames(overrides)){
            if(key.startsWith(':')) continue;
            if(key.startsWith('facebook.com/a.')){
                delete overrides[key];
                continue;
            }
            if(key != key.toLowerCase()){
                var v = overrides[key];
                delete overrides[key];
                overrides[key.toLowerCase()] = v;
            }
        }
        
        badIdentifiersArray.forEach(x => delete overrides[x]);

        overrides[MIGRATION] = CURRENT_VERSION;
        browser.storage.local.set({ overrides: overrides });
    }
    
    if (!v.installationId) {
        installationId = (Math.random() + '.' + Math.random() + '.' + Math.random()).replace(/\./g, '');
        browser.storage.local.set({ installationId: installationId });
    } else {
        installationId = v.installationId;
    }
})

var bloomFilters = [];

function loadBloomFilter(name) {

    var url = browser.extension.getURL('data/' + name + '.dat');
    fetch(url).then(response => {
        response.arrayBuffer().then(arrayBuffer => {
            var array = new Uint32Array(arrayBuffer);
            var b = new BloomFilter(array, 20);
            b.name = name;
            bloomFilters.push(b);
        });
    });
}



browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.acceptClicked !== undefined) {
        accepted = message.acceptClicked;
        browser.storage.local.set({ accepted: accepted });
        browser.tabs.remove(sender.tab.id);
        if (accepted && uncommittedResponse)
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
            for (var i = 0; i < id.length; i++) {
                sum += id.charCodeAt(i);
            }
            if (sum % 8 != 0) continue;
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
            "*://*.twitter.com/*",
            "*://medium.com/*",
            "*://disqus.com/*",
            "*://*.tumblr.com/*",
            "*://*.wikipedia.org/*",
            "*://*.rationalwiki.org/*",
            "*://*.google.com/*",
            "*://*.bing.com/*",
            "*://duckduckgo.com/*",
        ]
    });
}

createContextMenu('Mark as anti-trans', 'mark-transphobic');
createContextMenu('Mark as t-friendly', 'mark-t-friendly');
createContextMenu('Clear', 'mark-none');
createContextMenu('Help', 'help');

var uncommittedResponse = null;

function submitPendingRatings() {
    var submitted = overrides[PENDING_SUBMISSIONS].map(x => x);
    var requestBody = {
        installationId: installationId,
        entries: submitted
    }
    console.log('Sending request');
    fetch('https://k5kk18774h.execute-api.us-east-1.amazonaws.com/default/shinigamiEyesSubmission', {
        body: JSON.stringify(requestBody),
        method: 'POST',
        credentials: 'omit',
    }).then(response => {
        response.text().then(result => {
            console.log('Response: ' + result);
            if (result == 'SUCCESS') {
                overrides[PENDING_SUBMISSIONS] = overrides[PENDING_SUBMISSIONS].filter(x => submitted.indexOf(x) == -1);
                browser.storage.local.set({ overrides: overrides });
            }
        })

    });
}


function saveLabel(response) {
    if (accepted) {
        if (!overrides[PENDING_SUBMISSIONS]) {
            overrides[PENDING_SUBMISSIONS] = Object.getOwnPropertyNames(overrides)
                .map(x => { return { identifier: x, label: overrides[x] } });
        }
        overrides[response.identifier] = response.mark;
        if (response.secondaryIdentifier)
            overrides[response.secondaryIdentifier] = response.mark;
        browser.storage.local.set({ overrides: overrides });
        overrides[PENDING_SUBMISSIONS].push(response);
        submitPendingRatings();
        //console.log(response);
        browser.tabs.sendMessage(response.tabId, { updateAllLabels: true });
        //browser.tabs.executeScript(response.tabId, {code: 'updateAllLabels()'});
        return;
    }
    uncommittedResponse = response;
    openHelp();
}

function openHelp() {
    browser.tabs.create({
        url: browser.extension.getURL('help.html')
    })
}



browser.contextMenus.onClicked.addListener(function (info, tab) {
    if (info.menuItemId == 'help') {
        openHelp();
        return;
    }

    var label = info.menuItemId.substring('mark-'.length);
    if (label == 'none') label = '';
    browser.tabs.sendMessage(tab.id, {
        mark: label,
        url: info.linkUrl,
        // elementId: info.targetElementId,
        debug: overrides.debug
    }, null, response => {
        if (!response.identifier) return;
        if (response.mark){
            if (badIdentifiers[response.identifier]) return;
            if (response.secondaryIdentifier && badIdentifiers[response.secondaryIdentifier])
                response.secondaryIdentifier = null;
        }
        if (response.debug && /^facebook\.com\/[a-zA-Z]/.test(response.identifier))
            alert('Note: could not find numeric id for ' + response.identifier);
        response.tabId = tab.id;
        saveLabel(response);
    })

});
