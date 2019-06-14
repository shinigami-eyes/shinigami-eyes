var browser = browser || chrome;

var PENDING_SUBMISSIONS = ':PENDING_SUBMISSIONS'
var MIGRATION = ':MIGRATION'

var CURRENT_VERSION = 100018;

// If a user labels one of these URLs, they're making a mistake. Ignore the label.
// This list includes:
// * Social networks that are not supported
// * System pages of supported social networks
// * Archival and link shortening sites.
// * Reddit bots.
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
    'facebook.com/donate',
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
    'facebook.com/media',
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
    'facebook.com/docs',
    
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
    'reddit.com/user/_youtubot_',
    'reddit.com/user/animalfactsbot',
    'reddit.com/user/anti-gif-bot',
    'reddit.com/user/areyoudeaf',
    'reddit.com/user/auto-xkcd37',
    'reddit.com/user/automoderator',
    'reddit.com/user/autotldr',
    'reddit.com/user/biglebowskibot',
    'reddit.com/user/bots_rise_up',
    'reddit.com/user/cheer_up_bot',
    'reddit.com/user/cheer-bot',
    'reddit.com/user/clickablelinkbot',
    'reddit.com/user/colorizethis',
    'reddit.com/user/darnit_bot',
    'reddit.com/user/darthplagueisbot',
    'reddit.com/user/deepfrybot',
    'reddit.com/user/dreamprocessor',
    'reddit.com/user/drunkanimalfactbot',
    'reddit.com/user/election_info_bot',
    'reddit.com/user/eyebleachbot',
    'reddit.com/user/factorial-bot',
    'reddit.com/user/friendly-bot',
    'reddit.com/user/garlicbot',
    'reddit.com/user/gfycat_details_fixer',
    'reddit.com/user/gifv-bot',
    'reddit.com/user/good_good_gb_bb',
    'reddit.com/user/goodbot_badbot',
    'reddit.com/user/goodmod_badmod',
    'reddit.com/user/gyazo_bot',
    'reddit.com/user/haiku-detector',
    'reddit.com/user/haikubot-1911',
    'reddit.com/user/helperbot_',
    'reddit.com/user/hug-bot',
    'reddit.com/user/i_am_a_haiku_bot',
    'reddit.com/user/ilinknsfwsubreddits',
    'reddit.com/user/image_linker_bot',
    'reddit.com/user/imdb_preview',
    'reddit.com/user/imguralbumbot',
    'reddit.com/user/jacksfilmsbot',
    'reddit.com/user/jiffierbot',
    'reddit.com/user/livetwitchclips',
    'reddit.com/user/lyrics-matcher-bot',
    'reddit.com/user/mailmygovnnbot',
    'reddit.com/user/massdropbot',
    'reddit.com/user/mentioned_videos',
    'reddit.com/user/metric_units',
    'reddit.com/user/mlbvideoconverterbot',
    'reddit.com/user/morejpeg_auto',
    'reddit.com/user/movieguide',
    'reddit.com/user/multiusebot',
    'reddit.com/user/news-summary',
    'reddit.com/user/nflvideoconverterbot',
    'reddit.com/user/octopusfunfacts',
    'reddit.com/user/octupusfunfacts',
    'reddit.com/user/opfeels',
    'reddit.com/user/payrespects-bot',
    'reddit.com/user/perrycohen',
    'reddit.com/user/phonebatterylevelbot',
    'reddit.com/user/picdescriptionbot',
    'reddit.com/user/portmanteau-bot',
    'reddit.com/user/quoteme-bot',
    'reddit.com/user/redditsilverbot',
    'reddit.com/user/redditstreamable',
    'reddit.com/user/remindmebot',
    'reddit.com/user/riskyclickerbot',
    'reddit.com/user/rosey-the-bot',
    'reddit.com/user/seriouslywhenishl3',
    'reddit.com/user/shhbot',
    'reddit.com/user/smallsubbot',
    'reddit.com/user/snapshillbot',
    'reddit.com/user/sneakpeekbot',
    'reddit.com/user/stabbot_crop',
    'reddit.com/user/stabbot',
    'reddit.com/user/steamnewsbot',
    'reddit.com/user/subjunctive__bot',
    'reddit.com/user/table_it_bot',
    'reddit.com/user/the-paranoid-android',
    'reddit.com/user/thehelperdroid',
    'reddit.com/user/thiscatmightcheeryou',
    'reddit.com/user/timestamp_bot',
    'reddit.com/user/timezone_bot',
    'reddit.com/user/tiny_smile_bot',
    'reddit.com/user/tipjarbot',
    'reddit.com/user/tippr',
    'reddit.com/user/totes_meta_bot',
    'reddit.com/user/totesmessenger',
    'reddit.com/user/tumblrdirect',
    'reddit.com/user/tweetsincommentsbot',
    'reddit.com/user/twitterlinkbot',
    'reddit.com/user/twittertostreamable',
    'reddit.com/user/video_descriptionbot',
    'reddit.com/user/videodirectlinkbot',
    'reddit.com/user/vredditmirrorbot',
    'reddit.com/user/whodidthisbot',
    'reddit.com/user/wikitextbot',
    'reddit.com/user/xkcd_transcriber',
    'reddit.com/user/youtubefactsbot',
    'reddituploads.com',
    'removeddit.com',
    't.co',
    't.umblr.com',
    'tapatalk.com',
    'tmblr.co',
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

var lastSubmissionError = null;

var needsInfiniteResubmissionWorkaround = [
    '046775268347','094745034139','059025030493','016970595453','016488055088','028573603939',
    '047702135398','035965787127','069722626647','044482561296','068530257405','071378971311',
    '050784255720','074169481269','001621982155','014636303566','016313013148','051923868290',
    '025348057349','059525793150','047081840457','086106188740','080095076304','059341889183',
    '095799487873','099003666813','002434495335','009844923475','034297166260','065739632127',
    '040689448048','048816243838','018152001078','059285890303','073205501344','096068619182'
]

var overrides = null;

var accepted = false;
var installationId = null;

browser.storage.local.get(['overrides', 'accepted', 'installationId'], v => {
    if (!v.installationId) {
        installationId = (Math.random() + '.' + Math.random() + '.' + Math.random()).replace(/\./g, '');
        browser.storage.local.set({ installationId: installationId });
    } else {
        installationId = v.installationId;
    }

    accepted = v.accepted
    overrides = v.overrides || {}

    var migration = overrides[MIGRATION] || 0;
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

        if (needsInfiniteResubmissionWorkaround.indexOf(installationId.substring(0, 12)) != -1)
            overrides[PENDING_SUBMISSIONS] = [];
        overrides[MIGRATION] = CURRENT_VERSION;
        browser.storage.local.set({ overrides: overrides });
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

async function submitPendingRatings() {
    var submitted = overrides[PENDING_SUBMISSIONS].map(x => x);
    var requestBody = {
        installationId: installationId,
        lastError: lastSubmissionError,
        entries: submitted
    }
    lastSubmissionError = null;
    console.log('Sending request');
    try {
        var response = await fetch('https://k5kk18774h.execute-api.us-east-1.amazonaws.com/default/shinigamiEyesSubmission', {
            body: JSON.stringify(requestBody),
            method: 'POST',
            credentials: 'omit',
        });
        if (response.status != 200) throw ('HTTP status: ' + response.status)
        var result = await response.text();    
        
        if (result != 'SUCCESS') throw 'Bad response: ' + ('' + result).substring(0, 20);

        overrides[PENDING_SUBMISSIONS] = overrides[PENDING_SUBMISSIONS].filter(x => submitted.indexOf(x) == -1);
        browser.storage.local.set({ overrides: overrides });
    } catch(e) {
        lastSubmissionError = '' + e
    }

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
        response.version = CURRENT_VERSION;
        response.submissionId = (Math.random() + '').replace('.', '');
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

    var tabId = tab.id;
    var frameId = info.frameId;

    var label = info.menuItemId.substring('mark-'.length);
    if (label == 'none') label = '';
    browser.tabs.sendMessage(tabId, {
        mark: label,
        url: info.linkUrl,
        tabId: tabId,
        frameId: frameId,
        // elementId: info.targetElementId,
        debug: overrides.debug
    }, { frameId: frameId }, response => {
        if (!response.identifier) return;
        if (response.mark){
            if (badIdentifiers[response.identifier]) return;
            if (response.secondaryIdentifier && badIdentifiers[response.secondaryIdentifier])
                response.secondaryIdentifier = null;
        }
        if (response.debug && /^facebook\.com\/[a-zA-Z]/.test(response.identifier))
            alert('Note: could not find numeric id for ' + response.identifier);
        response.tabId = tabId;
        response.frameId = frameId;
        saveLabel(response);
    })

});
