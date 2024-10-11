var browser: Browser = browser || chrome;

const PENDING_SUBMISSIONS = ':PENDING_SUBMISSIONS'
const MIGRATION = ':MIGRATION'

const CURRENT_VERSION = 100037;

const BUNDLED_BLOOM_FILTER_VERSION = 24092900
const badIdentifiersReasons: { [id: string]: BadIdentifierReason } = {};
const badIdentifiers: { [id: string]: true } = {};

interface BloomFilters { 
    transphobic: CombinedBloomFilter;
    tfriendly: CombinedBloomFilter;
    bloomVersion: number;
}

// If a user labels one of these URLs, they're making a mistake. Ignore the label.
// This list includes:
// * Social networks that are not supported (SN)
// * System pages of supported social networks
// * Archival and link shortening sites. (AR)
// * Reddit bots.
const badIdentifiersArray = [
    'a.co',
    'about.me=SN',
    'allmylinks.com=SN',
    'amzn.to',
    'archive.is=AR',
    'archive.org=AR',
    'archiveofourown.org=SN',
    'ask.fm=SN',
    'assets.tumblr.com',
    'beacons.ai=SN',
    'bing.com',
    'bit.ly',
    'blogspot.com',
    'buymeacoffee.com=SN',
    'cash.app=SN',
    'cash.me=SN',
    'change.org',
    'chrome.google.com',
    'cohost.org',
    'cohost.org/rc',
    'counter.social=SN',
    'curiouscat.live=SN',
    'curiouscat.me=SN',
    'curiouscat.qa=SN',
    'curiositystream.com=SN',
    'deviantart.com=SN',
    'discord.gg=SN',
    'discordapp.com=SN',
    'discord-store.com=SN',
    'disqus.com',
    'docs.google.com',
    'drive.google.com',
    'duckduckgo.com',
    'en.wikipedia.org',
    'en.wikiquote.org',
    'etsy.com=SN',
    'facebook.com',
    'facebook.com/a',
    'facebook.com/about',
    'facebook.com/ad_campaign',
    'facebook.com/ads',
    'facebook.com/advertising',
    'facebook.com/ajax',
    'facebook.com/bookmarks',
    'facebook.com/browse',
    'facebook.com/buddylist.php',
    'facebook.com/bugnub',
    'facebook.com/business',
    'facebook.com/c',
    'facebook.com/comment',
    'facebook.com/composer',
    'facebook.com/connect',
    'facebook.com/dialog',
    'facebook.com/docs',
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
    'facebook.com/instantgames',
    'facebook.com/intl',
    'facebook.com/jobs',
    'facebook.com/l.php',
    'facebook.com/language.php',
    'facebook.com/latest',
    'facebook.com/legal',
    'facebook.com/like.php',
    'facebook.com/local_surface',
    'facebook.com/logout.php',
    'facebook.com/marketplace',
    'facebook.com/mbasic',
    'facebook.com/me',
    'facebook.com/media',
    'facebook.com/memories',
    'facebook.com/menu',
    'facebook.com/messages',
    'facebook.com/nfx',
    'facebook.com/notes',
    'facebook.com/notifications',
    'facebook.com/notifications.php',
    'facebook.com/nt',
    'facebook.com/page',
    'facebook.com/pages',
    'facebook.com/people',
    'facebook.com/permalink.php',
    'facebook.com/pg',
    'facebook.com/photo',
    'facebook.com/photo.php',
    'facebook.com/places',
    'facebook.com/policies',
    'facebook.com/privacy',
    'facebook.com/profile',
    'facebook.com/profile.php',
    'facebook.com/public',
    'facebook.com/rapid_report',
    'facebook.com/reactions',
    'facebook.com/salegroups',
    'facebook.com/search',
    'facebook.com/settings',
    'facebook.com/share',
    'facebook.com/share.php',
    'facebook.com/sharer.php',
    'facebook.com/shares',
    'facebook.com/stories',
    'facebook.com/story.php',
    'facebook.com/support',
    'facebook.com/timeline',
    'facebook.com/ufi',
    'facebook.com/video',
    'facebook.com/watch',
    'fb.me',
    'flickr.com=SN',
    'furaffinity.net=SN',
    'gofundme.com=SN',
    'goo.gl',
    'google.com',
    'googleusercontent.com',
    'handle.invalid',
    'hivesocial.app=SN',
    'http',
    'https',
    'i.imgur.com',
    'i.reddituploads.com',
    'imdb.com=SN',
    'imgur.com',
    'indiegogo.com=SN',
    'instagram.com=SN',
    'itunes.apple.com=SN',
    'ko-fi.com=SN',
    'last.fm=SN',
    'linkedin.com=SN',
    'linktr.ee=SN',
    'mail.google.com',
    'media.tumblr.com',
    'at.tumblr.com',
    'medium.com',
    'nebula.app=SN',
    'nebula.tv=SN',
    'news.google.com',
    'onlyfans.com=SN',
    'open.spotify.com=SN',
    'patreon.com=SN',
    'paypal.com=SN',
    'paypal.me=SN',
    'post.news=SN',
    'pillowfort.social=SN',
    'pinterest.com=SN',
    'pixiv.net',
    'play.google.com',
    'plus.google.com=SN',
    'podcasts.apple.com=SN',
    'poshmark.com=SN',
    'rationalwiki.org',
    'reddit.com',
    'reddit.com/r/all',
    'reddit.com/r/popular',
    'reddit.com/user/_youtubot_',
    'reddit.com/user/animalfactsbot',
    'reddit.com/user/anti-gif-bot',
    'reddit.com/user/areyoudeaf',
    'reddit.com/user/automoderator',
    'reddit.com/user/autotldr',
    'reddit.com/user/auto-xkcd37',
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
    'reddit.com/user/haikubot-1911',
    'reddit.com/user/haiku-detector',
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
    'reddit.com/user/magic_eye_bot',
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
    'reddit.com/user/stabbot',
    'reddit.com/user/stabbot_crop',
    'reddit.com/user/steamnewsbot',
    'reddit.com/user/subjunctive__bot',
    'reddit.com/user/table_it_bot',
    'reddit.com/user/thehelperdroid',
    'reddit.com/user/the-paranoid-android',
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
    'sites.google.com',
    'snapchat.com=SN',
    'soundcloud.com=SN',
    'spotify.com=SN',
    'steamcommunity.com=SN',
    't.co',
    't.me=SN',
    't.umblr.com',
    'tapastic.com=SN',
    'tapatalk.com=SN',
    'tinyurl.com',
    'tiktok.com=SN',
    'tmblr.co',
    'tumblr.com',
    'communities.tumblr.com',
    'twitch.tv=SN',
    'x.com',
    'twitter.com',
    'twitter.com/explore',
    'twitter.com/hashtag',
    'twitter.com/home',
    'twitter.com/i',
    'twitter.com/intent',
    'twitter.com/messages',
    'twitter.com/notifications',
    'twitter.com/search',
    'twitter.com/settings',
    'twitter.com/share',
    'twitter.com/threader_app',
    'twitter.com/threadreaderapp',
    'twitter.com/who_to_follow',
    'vimeo.com=SN',
    'vk.com=SN',
    'vm.tiktok.com=SN',
    'wattpad.com=SN',
    'wikipedia.org',
    'wordpress.com',
    'wp.me',
    'www.tumblr.com',
    'youtu.be',
    'youtube.com',
    'youtube.com/account',
    'youtube.com/embed',
    'youtube.com/feed',
    'youtube.com/gaming',
    'youtube.com/playlist',
    'youtube.com/shorts',
    'youtube.com/premium',
    'youtube.com/redirect',
    'youtube.com/watch',
    'anarchism.space',
    'aus.social',
    'c.im',
    'chaos.social',
    'eightpoint.app',
    'eldritch.cafe',
    'fosstodon.org',
    'hachyderm.io',
    'infosec.exchange',
    'kolektiva.social',
    'mas.to',
    'masto.ai',
    'mastodon.art',
    'mastodon.cloud',
    'mastodon.green',
    'mastodon.ie',
    'mastodon.lol',
    'mastodon.nz',
    'mastodon.online',
    'mastodon.scot',
    'mastodon.social',
    'mastodon.world',
    'mastodon.xyz',
    'mastodonapp.uk',
    'meow.social',
    'mstdn.ca',
    'mstdn.jp',
    'mstdn.social',
    'octodon.social',
    'ohai.social',
    'pixelfed.social',
    'queer.party',
    'sfba.social',
    'social.transsafety.network',
    'tech.lgbt',
    'techhub.social',
    'toot.cat',
    'toot.community',
    'toot.wales',
    'vulpine.club',
    'wandering.shop',

    'threads.net',
    'bsky.social=SN',
    'bsky.app=SN'
].map(x => {
    const arr = x.split('=');
    const id = arr[0];
    if (arr[1]) badIdentifiersReasons[id] = <BadIdentifierReason>arr[1];
    badIdentifiers[id] = true;
    return id;
});



const ASYMMETRIC_COMMENT = "Submission data is asymmetrically encrypted (in addition to HTTPS), so that not even the cloud provider can access it (since it doesn't have the corresponding private key). Actual processing and decryption is done off-cloud in a second phase. If you want to inspect the submission data *before* it gets encrypted, open the extension debugging dev tools (chrome://extensions or about:debugging) and look at the console output, or call setAsymmetricEncryptionEnabled(false) to permanently turn asymmetric encryption off.";


// This key is public. Decrypting requires a different key.
const SHINIGAMI_PUBLIC_ENCRYPTION_KEY = {
    "alg": "RSA-OAEP-256",
    "e": "AQAB",
    "ext": true,
    "key_ops": [
        "encrypt"
    ],
    "kty": "RSA",
    "n": "sJ8r8D_Ae_y4db_sSZvLIqTCjAdyDEIMXHcCNM_sOO_t2RmcUETecKyDdNVtaY9Ve0OM1cyHz-YEYXMpNQx_NcXd6KDdGxZ1MUTlja5tUIDMNw-N0hzZbmvk-4MymMpN25lwdvCGo3Ri6EJ7XRMZbtmwTfQoZR5olfGi_Y0SbTw0RJ-U9Wf2CqlQ7w8x-M77cPaANKav_yOitwlJjhkZTo6ssvdnsc20OIP46XSYRwyzlMAlx7wQ2Dw7aX4bkPMbgs2L13uAFPCvQOBnE4esD2MyICKiIe0j-wgVK4qh0gmh513HNYewsgsoiMJlzz5v2epFwh25icIEHfYRcKteryEuzKUZ7g-FqdLb6sI_hrnvvu6D8MIDH1Baq179lpyFjJ4_famcuRuHsRPSwyQSX8v8DL23lARX8U9ZhcH0f3bBepuzEHXutnqxGxnErnxZGGr64saIBgGdtuOYbYuFqzMjCUvlFyCVh8DItRsJOdzj6xAxafnU5yvSJqcgAX0PQclbwIyg6wtxVa1et6Q7QiM16s5RyW2KHxp27PaBAuVlgVBG8S4DguJK3Y9E2vkgDTpFoSS-J80tZhZhPZ4PZL4ouvYrNnR3JgveuLYZsmYdpjtShkO_6erSanM0ZRb0E00TUYRykkviDtBLDP1aYNXv4_5jhAlLc_tOmWK_RLc"
};




var lastSubmissionError: string = null;

var overrides: LabelMap = null;

var accepted = false;
var installationId: string = null;
var theme: string = '';

var disableAsymmetricEncryption = false;
var cacheStorage: Cache;


function writeLocalStorage(v: any): Promise<void> { 
    return new Promise(resolve => browser.storage.local.set(v, resolve));
}

function readLocalStorage(keys: string[]) : Promise<any> { 
    return new Promise(resolve => { 
        browser.storage.local.get(keys, v => resolve(v));
    });
}

var initializationPromise = (async () => {
    var v = await readLocalStorage(['overrides', 'accepted', 'installationId', 'theme', 'disableAsymmetricEncryption', 'disableDynamicUpdates', 'dynamicBloomLastUpdate']);
    if (!v.installationId) {
        installationId = crypto.randomUUID();
        browser.storage.local.set({ installationId: installationId });
    } else {
        installationId = v.installationId;
    }

    accepted = v.accepted
    overrides = v.overrides || {}
    theme = v.theme;
    disableAsymmetricEncryption = v.disableAsymmetricEncryption || false;

    const migration = +(overrides[MIGRATION] || 0);
    if (migration < CURRENT_VERSION) {

        for (const key of Object.getOwnPropertyNames(overrides)) {
            if (key.startsWith(':')) continue;
            if (key.startsWith('facebook.com/a.')) {
                delete overrides[key];
                continue;
            }
            if (key != key.toLowerCase()) {
                let v = overrides[key];
                delete overrides[key];
                overrides[key.toLowerCase()] = v;
            }
        }

        badIdentifiersArray.forEach(x => delete overrides[x]);

        overrides[MIGRATION] = <any>CURRENT_VERSION;
        browser.storage.local.set({ overrides: overrides });
    }

    if (!v.disableDynamicUpdates) {
        try {
            cacheStorage = await caches.open('v1');
            await loadDynamicBloomFilters(true);
        } catch (e) {
            console.warn('Could not load dynamic filters:')
            console.warn(e);
        }
    }

    if (!bloomFilters) { 
        bloomFilters = {
            tfriendly: await loadBloomFilterBundled('t-friendly'),
            transphobic: await loadBloomFilterBundled('transphobic'),
            bloomVersion: BUNDLED_BLOOM_FILTER_VERSION
        };
        console.log('Loaded bundled bloom filters.')
    }
    
    if (!v.disableDynamicUpdates) {
        const now = Date.now();
        const dynamicBloomLastUpdate = <number>v.dynamicBloomLastUpdate;
        const UPDATE_INTERVAL_MS = 4 * 3600 * 1000;
        var initialDelay = !dynamicBloomLastUpdate || dynamicBloomLastUpdate > now ? 0 : Math.max(0, dynamicBloomLastUpdate + UPDATE_INTERVAL_MS - now);

        console.log('Initial delay for update check: ' + initialDelay)
        setTimeout(() => { 
            setInterval(checkBloomFilterUpdates, UPDATE_INTERVAL_MS);
            checkBloomFilterUpdates()
        }, Math.max(5000, initialDelay));
        
    }

})();
        
interface DynamicConfiguration { 
    transphobic: string;
    tfriendly: string;
    bloomVersion: number;
    acceptDowngrades: boolean;
}


async function checkBloomFilterUpdates() { 
    try {
        console.log('Checking for updates...')
        const now = Date.now();

        await writeLocalStorage({ dynamicBloomLastUpdate: now });

        const response = await fetch('https://raw.githubusercontent.com/shinigami-eyes/configuration/main/configuration.json' + '?random=' + Math.random(), {cache: "no-cache"})
        if (response.status != 200) throw ('HTTP status ' + response.status);
        const config = <DynamicConfiguration>await response.json();
        if (!config.bloomVersion) throw 'Missing bloomVersion';

        if (!config.acceptDowngrades) { 
            if (config.bloomVersion < bloomFilters.bloomVersion) { 
                console.log('Ignoring version downgrade')
                return;
            }
        }
        const dynamicBloomTransphobicURL = config.transphobic.replace('%VERSION%', config.bloomVersion.toString());
        const dynamicBloomTFriendlyURL = config.tfriendly.replace('%VERSION%', config.bloomVersion.toString());
        await writeLocalStorage({ dynamicBloomTransphobicURL, dynamicBloomTFriendlyURL, dynamicBloomVersion: config.bloomVersion });

        console.log('Successfully checked for updates: ' + config.bloomVersion);
    
        await loadDynamicBloomFilters(false);
    } catch (e) { 
        console.warn('checkBloomFilterUpdates failed:');
        console.warn(e);
    }
}

async function getCached(cache: Cache, url: string, onlyIfPrecached: boolean) : Promise<Response | null> { 
    const existing = await cache.match(url);
    if (existing) { 
        console.log('Already cached: ' + url);
        return existing;
    }
    if (onlyIfPrecached) { 
        console.log('Not precached, aborting: ' + url)
        return null;
    }
    await cache.add(url);
    const response = await cache.match(url);
    console.log('Fetched: ' + url);
    return response;
}

async function loadDynamicBloomFilters(onlyIfPrecached: boolean) : Promise<void> { 
    const info = await readLocalStorage(['dynamicBloomTransphobicURL', 'dynamicBloomTFriendlyURL', 'dynamicBloomVersion']);
    if (!info.dynamicBloomTransphobicURL || !info.dynamicBloomVersion) return;

    if (bloomFilters && bloomFilters.bloomVersion == info.dynamicBloomVersion) { 
        console.log('Bloom filters already loaded at version ' + bloomFilters.bloomVersion);
        return;
    }

    const transphobicResponse = await getCached(cacheStorage, info.dynamicBloomTransphobicURL, onlyIfPrecached);
    const tfriendlyResponse = await getCached(cacheStorage, info.dynamicBloomTFriendlyURL, onlyIfPrecached);
    if (!transphobicResponse || !tfriendlyResponse) return;

    bloomFilters = <BloomFilters>{
        transphobic: await loadBloomFilterFromResponse('transphobic', transphobicResponse, 1419972),
        tfriendly: await loadBloomFilterFromResponse('t-friendly', tfriendlyResponse, 1419972),
        bloomVersion: info.dynamicBloomVersion
    };
    console.log('Loaded dynamic filters at version: ' + bloomFilters.bloomVersion);
}

let bloomFilters: BloomFilters = null;


async function loadBloomFilterBundled(name: LabelKind): Promise<CombinedBloomFilter> {
    const url = getURL('data/' + name + '.dat');
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    return loadBloomFilterFromBuffer(name, arrayBuffer)
}

async function loadBloomFilterFromResponse(name: LabelKind, response: Response, expectedSize: number): Promise<CombinedBloomFilter> { 
    var arrayBuffer = await response.arrayBuffer();
    if (arrayBuffer.byteLength != expectedSize) throw 'Mismatching bloom filter size.'
    return await loadBloomFilterFromBuffer(name, arrayBuffer);
}

function loadBloomFilterFromBuffer(name: LabelKind, data: ArrayBuffer) : CombinedBloomFilter {
    const combined = new CombinedBloomFilter();
    combined.name = name;
    combined.parts = [
        new BloomFilter(new Int32Array(data.slice(0, 287552)), 20),
        new BloomFilter(new Int32Array(data.slice(287552)), 21),
    ];
    return combined;
}


function setAsymmetricEncryptionEnabled(enabled: boolean) {
    disableAsymmetricEncryption = !enabled;
    browser.storage.local.set({ disableAsymmetricEncryption: disableAsymmetricEncryption });
}


async function handleMessage(message: ShinigamiEyesMessage, sender: MessageSender) : Promise<LabelMap> { 
    if (message.setTheme) {
        theme = message.setTheme;
        browser.storage.local.set({ theme: message.setTheme });
        chrome.tabs.query({}, function (tabs) {
            for (var i = 0; i < tabs.length; ++i) {
                try {
                    sendMessageToContent(tabs[i].id, null, { updateAllLabels: true });
                } catch (e) { }
            }
        });
    }
    if (message.acceptClicked !== undefined) {
        accepted = message.acceptClicked;
        browser.storage.local.set({ accepted: accepted });
        if (accepted && uncommittedResponse)
            saveLabel(uncommittedResponse)
        uncommittedResponse = null;
    }
    if (message.closeCallingTab) {
        browser.tabs.remove(sender.tab.id);
        return {};
    }
    const response: LabelMap = {};
    await initializationPromise;
    const tfriendlyBloomFilter = bloomFilters.tfriendly;
    const transphobicBloomFilter = bloomFilters.transphobic;
    const transphobic = message.myself && transphobicBloomFilter.test(message.myself) && installationId.includes('-');
    for (const id of message.ids) {
        if (overrides[id] !== undefined) {
            response[id] = overrides[id];
            continue;
        }
        if (transphobic) {
            if (id == message.myself) continue;
            let sum = 0;
            for (let i = 0; i < id.length; i++) {
                sum += id.charCodeAt(i);
            }
            if (sum % 8 != 0) continue;
        }

        const isTFriendly = testBloomFilter(tfriendlyBloomFilter, id);
        const isTransphobic = testBloomFilter(transphobicBloomFilter, id);
        if (isTransphobic != isTFriendly)
            response[id] = isTransphobic ? 'transphobic' : 't-friendly';
    }
    response[':theme'] = <any>theme;
    return response;
}

function testBloomFilter(bloomFilter: CombinedBloomFilter, id: string) { 
    if (bloomFilter.test(id)) return true;
    if (id.startsWith('youtube.com/@') && bloomFilter.test(id.replace('/@', '/c/'))) return true;
    return false;
}

browser.runtime.onMessage.addListener<ShinigamiEyesMessage, ShinigamiEyesMessage | LabelMap>((message, sender, sendResponse) => {
    handleMessage(message, sender).then(response => sendResponse(response));
    return true;
});


const socialNetworkPatterns = [
    "*://*.facebook.com/*",
    "*://*.youtube.com/*",
    "*://*.reddit.com/*",
    "*://*.twitter.com/*",
    "*://*.x.com/*",
    "*://*.t.co/*",
    "*://*.bsky.app/*",
    "*://*.bsky.social/*",
    "*://*.medium.com/*",
    "*://disqus.com/*",
    "*://*.tumblr.com/*",
    "*://*.wikipedia.org/*",
    "*://*.rationalwiki.org/*",
    "*://*.google.com/*",
    "*://*.bing.com/*",
    "*://duckduckgo.com/*",
    "*://cohost.org/*",

    "*://*/@*",
    "*://*/users/*",
];

const homepagePatterns = [
            "*://*/",
            "*://*/?fbclid=*",
            "*://*/about*",
            "*://*/contact*",
            "*://*/faq*",
            "*://*/blog",
            "*://*/blog/",
            "*://*/news",
            "*://*/news/",
            "*://*/en/",
            "*://*/index.html",
            "*://*/index.php",
];

const allPatterns = socialNetworkPatterns.concat(homepagePatterns);

function createEntityContextMenu(text: string, id: ContextMenuCommand) {
    browser.contextMenus.create({
        id: id,
        title: text,
        contexts: ["link"],
        targetUrlPatterns: allPatterns
    });
}


function createSystemContextMenu(text: string, id: ContextMenuCommand, separator?: boolean) {
    browser.contextMenus.create({
        id: id,
        title: text,
        contexts: ["all"],
        type: separator ? 'separator' : 'normal',
        documentUrlPatterns: allPatterns
    });
}


browser.contextMenus.create({
    title: '(Please right click on a link instead)', 
    id: 'instructions-needs-link',
    enabled: false,
    contexts: ['page'],
    documentUrlPatterns: socialNetworkPatterns
});

createEntityContextMenu('Mark as anti-trans', 'mark-transphobic');
createEntityContextMenu('Mark as t-friendly', 'mark-t-friendly');
createEntityContextMenu('Clear', 'mark-none');

createSystemContextMenu('---', 'separator', true);
createSystemContextMenu('Settings', 'options');
createSystemContextMenu('Help', 'help');

var uncommittedResponse: ShinigamiEyesSubmission = null;








/*
 * base64-arraybuffer
 * https://github.com/niklasvh/base64-arraybuffer
 *
 * Copyright (c) 2012 Niklas von Hertzen
 * Licensed under the MIT license.
 */


const BASE_64_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

function bufferToBase64(arraybuffer: ArrayBuffer) {
    var bytes = new Uint8Array(arraybuffer),
        i, len = bytes.length, base64 = "";

    for (i = 0; i < len; i += 3) {
        base64 += BASE_64_CHARS[bytes[i] >> 2];
        base64 += BASE_64_CHARS[((bytes[i] & 3) << 4) | (bytes[i + 1] >> 4)];
        base64 += BASE_64_CHARS[((bytes[i + 1] & 15) << 2) | (bytes[i + 2] >> 6)];
        base64 += BASE_64_CHARS[bytes[i + 2] & 63];
    }

    if ((len % 3) === 2) {
        base64 = base64.substring(0, base64.length - 1) + "=";
    } else if (len % 3 === 1) {
        base64 = base64.substring(0, base64.length - 2) + "==";
    }

    return base64;
}

function objectToBytes(obj: any) {
    const json = JSON.stringify(obj);
    const textEncoder = new TextEncoder();
    return textEncoder.encode(json);
}

interface AsymmetricallyEncryptedData {
    symmetricKey: JsonWebKey;
    sha256: string;
}

async function encryptSubmission(plainObj: any): Promise<CipherSubmission> {
    const publicEncryptionKey = await crypto.subtle.importKey('jwk', SHINIGAMI_PUBLIC_ENCRYPTION_KEY, {
        name: 'RSA-OAEP',
        hash: 'SHA-256'
    }, false, ['encrypt']);

    // Since asymmetric encryption only supports limited data size, we encrypt data symmetrically
    // and then protect the symmetric key asymmetrically.
    const symmetricKey = await crypto.subtle.generateKey(
        {
            name: 'AES-CBC',
            length: 256
        },
        true,
        ['encrypt', 'decrypt']
    );

    const iv = globalThis.crypto.getRandomValues(new Uint8Array(16));

    const plainData = objectToBytes(plainObj);

    const symmetricallyEncryptedData = await crypto.subtle.encrypt({
        name: "AES-CBC",
        iv
    }, symmetricKey, plainData);

    const plainHash = await crypto.subtle.digest('SHA-256', plainData);

    const asymmetricallyEncryptedSymmetricKey = await crypto.subtle.encrypt(
        {
            name: 'RSA-OAEP'
        },
        publicEncryptionKey,
        objectToBytes(<AsymmetricallyEncryptedData>{
            symmetricKey: await crypto.subtle.exportKey('jwk', symmetricKey),
            sha256: bufferToBase64(plainHash)
        })
    );
    return {
        _comment: ASYMMETRIC_COMMENT,
        asymmetricallyEncryptedSymmetricKey: bufferToBase64(asymmetricallyEncryptedSymmetricKey),
        symmetricInitializationVector: bufferToBase64(iv),
        symmetricallyEncryptedData: bufferToBase64(symmetricallyEncryptedData),
        version: CURRENT_VERSION
    };
}

interface CipherSubmission {
    _comment: string;
    asymmetricallyEncryptedSymmetricKey: string;
    symmetricInitializationVector: string;
    symmetricallyEncryptedData: string;
    version: number;
}

const submissionsBeingSubmitted = new Set<ShinigamiEyesSubmission>();

async function submitPendingRatings() {
    const submitted = getPendingSubmissions().filter(x => !submissionsBeingSubmitted.has(x));
    for (const entry of submitted) {
        submissionsBeingSubmitted.add(entry);
    }
    
    let plainRequest : any = {
        installationId: installationId,
        lastError: lastSubmissionError,
        entries: submitted
    }

    console.log('Submitting request:');
    console.log(plainRequest);

    let actualRequest = plainRequest;

    if (!disableAsymmetricEncryption) {
        
        try {
            actualRequest = await encryptSubmission(plainRequest);
        } catch (e) {
            // If something goes wrong, fall back to the old behavior (of course, we still have HTTPS).
            // While the above encryption process has been tested on both Chromium- and Gecko-based browsers,
            // the real world behavior might be different.
            // If no significant issues appear, this catch clause will be removed in a subsequent version of Shinigami Eyes.
            actualRequest.encryptionError = e + '';
        }
        
    }

    lastSubmissionError = null;
    try {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), 90000);
        const response = await fetch('https://shini-api.xyz/submit-vote', {
            body: JSON.stringify(actualRequest),
            method: 'POST',
            credentials: 'omit',
            signal: controller.signal
        });
        if (response.status != 200) throw ('HTTP status: ' + response.status)
        const result = await response.text();

        if (result != 'SUCCESS') throw 'Bad response: ' + ('' + result).substring(0, 20);

        overrides[PENDING_SUBMISSIONS] = <any>getPendingSubmissions().filter(x => submitted.indexOf(x) == -1);
        browser.storage.local.set({ overrides: overrides });
    } catch (e) {
        lastSubmissionError = '' + e
    } finally {
        for (const entry of submitted) {
            submissionsBeingSubmitted.delete(entry);
        }
    }

}

function getPendingSubmissions(): ShinigamiEyesSubmission[] {
    return <any>overrides[PENDING_SUBMISSIONS];
}


function saveLabel(response: ShinigamiEyesSubmission) {
    if (accepted) {
        if (!getPendingSubmissions()) {
            overrides[PENDING_SUBMISSIONS] = <any>Object.getOwnPropertyNames(overrides)
                .map<ShinigamiEyesSubmission>(x => { return { identifier: x, label: overrides[x] } });
        }
        overrides[response.identifier] = response.mark;
        if (response.secondaryIdentifier && !response.secondaryIdentifier.startsWith('twitter.com/i/user/'))
            overrides[response.secondaryIdentifier] = response.mark;
        browser.storage.local.set({ overrides: overrides });
        response.version = CURRENT_VERSION;
        response.bloomVersion = bloomFilters.bloomVersion;
        response.submissionId = (Math.random() + '').replace('.', '');
        let totalSize = 0;
        for (const entry of getPendingSubmissions()) {
            if(entry.snippet)
                totalSize += entry.snippet.length;
        }
        if (totalSize > 2000000) {
            for (const entry of getPendingSubmissions()) {
                entry.snippet = null;
                entry.trimmed = true;
            }
        }
        if (response.snippet && response.snippet.length > 10000000) {
            response.snippet = null;
            response.trimmed = true;
        }
        getPendingSubmissions().push(response);
        submitPendingRatings();
        //console.log(response);
        sendMessageToContent(response.tabId, response.frameId, {
            updateAllLabels: true,
            confirmSetIdentifier: response.identifier,
            confirmSetUrl: response.url,
            confirmSetLabel: response.mark || 'none'
        });
        //browser.tabs.executeScript(response.tabId, {code: 'updateAllLabels()'});
        return;
    }
    uncommittedResponse = response;
    openHelp();
}

function openHelp() {
    browser.tabs.create({
        url: getURL('help.html')
    })
}


function openOptions() {
    browser.tabs.create({
        url: getURL('options.html')
    })
}

function getURL(path: string) { 
    return browser.extension.getURL(path);
}


function sendMessageToContent(tabId: number, frameId: number, message: ShinigamiEyesCommand) {
    const options = frameId === null ? undefined : { frameId: frameId };
    console.log(message);
    browser.tabs.sendMessage<ShinigamiEyesCommand, void>(tabId, message, options);
}

browser.contextMenus.onClicked.addListener(function (info, tab) {
    if (info.menuItemId == 'help') {
        openHelp();
        return;
    }
    if (info.menuItemId == 'options') {
        openOptions();
        return;
    }

    const tabId = tab.id;
    const frameId = info.frameId;

    var label = <LabelKind>info.menuItemId.substring('mark-'.length);
    if (label == 'none') label = '';
    browser.tabs.sendMessage<ShinigamiEyesSubmission, ShinigamiEyesSubmission>(tabId, {
        mark: label,
        url: info.linkUrl,
        tabId: tabId,
        frameId: frameId,
        // elementId: info.targetElementId,
        debug: <any>overrides.debug
    }, { frameId: frameId }, response => {
        if (!response || !response.identifier) {
            return;
        }
        if (response.mark) {
            if (badIdentifiers[response.identifier]) {
                sendMessageToContent(tabId, frameId, {
                    confirmSetIdentifier: response.identifier,
                    confirmSetUrl: response.url,
                    confirmSetLabel: 'bad-identifier',
                    badIdentifierReason: badIdentifiersReasons[response.identifier]
                });
                return;
            }
            if (response.secondaryIdentifier && badIdentifiers[response.secondaryIdentifier])
                response.secondaryIdentifier = null;
        }
        response.tabId = tabId;
        response.frameId = frameId;
        saveLabel(response);
    })

});
