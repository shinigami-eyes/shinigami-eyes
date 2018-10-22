var browser = browser || chrome;

var hostname = typeof (location) != 'undefined' ? location.hostname : '';
if (hostname.startsWith('www.')) {
    hostname = hostname.substring(4);
}
if (hostname.endsWith('.reddit.com')) hostname = 'reddit.com';

var myself = null;
if (hostname == 'reddit.com') {
    myself = document.querySelector('#header-bottom-right .user a');
    if (!myself) {
        var m = document.querySelector('#USER_DROPDOWN_ID');
        if (m) {
            m = [...m.querySelectorAll('*')].filter(x => x.childNodes.length == 1 && x.firstChild.nodeType == 3).map(x => x.textContent)[0]
            if (m) myself = 'reddit.com/user/' + m;
        }
    }
}
if (hostname == 'facebook.com') {
    var m = document.querySelector("[id^='profile_pic_header_']")
    if (m) myself = 'facebook.com/' + captureRegex(m.id, /header_(\d+)/);
}
if (hostname == 'twitter.com') {
    myself = document.querySelector('.DashUserDropdown-userInfo a');
}

if (myself && (myself.href || myself.startsWith('http:') || myself.startsWith('https:')))
    myself = getIdentifier(myself);
//console.log('Myself: ' + myself)

function init() {
    updateAllLabels();

    var observer = new MutationObserver(mutationsList => {

        for (var mutation of mutationsList) {
            if (mutation.type == 'childList') {
                for (var node of mutation.addedNodes) {
                    if (node.tagName == 'A') {
                        initLink(node);
                    }
                    if (node.querySelectorAll) {
                        for (var subnode of node.querySelectorAll('a')) {
                            initLink(subnode);
                        }
                    }
                }
            }
        }
        solvePendingLabels();

    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });



}

function updateAllLabels(refresh) {
    if (refresh) knownLabels = {};
    var links = document.links;
    for (var i = 0; i < links.length; i++) {
        var a = links[i];
        initLink(a);
    }
    solvePendingLabels();
}


var knownLabels = {};

var labelsToSolve = [];
function solvePendingLabels() {
    if (!labelsToSolve.length) return;
    var uniqueIdentifiers = Array.from(new Set(labelsToSolve.map(x => x.identifier)));
    var tosolve = labelsToSolve;
    labelsToSolve = [];
    browser.runtime.sendMessage({ ids: uniqueIdentifiers, myself: myself }, response => {
        for (item of tosolve) {
            var label = response[item.identifier];
            knownLabels[item.identifier] = label || '';
            applyLabel(item.element, item.identifier);
        }
    });
}

function applyLabel(a, identifier) {

    if (a.assignedCssLabel) {
        a.classList.remove('assigned-label-' + a.assignedCssLabel);
        a.classList.remove('has-assigned-label');
    }
    var label = a.assignedLabel = knownLabels[identifier] || '';

    // https://rationalwiki.org/wiki/RationalWiki:Webshites
    a.assignedCssLabel =
        !label ? '' :
            label == 'liked' ? 'liked' :
                label == 'disliked' ? 'disliked' :
                    label == 'rw-radfem' || label == 'terf' || label == 'transphobic' || label == 'anti-lgbt' ? 'transphobic' :
                        label == 't-friendly' ? 't-friendly' :
                            label == 'rw-skeptic' || label == 'rw-liberal' || label == 'rw-feminism' || label == 'science' ? 'good' :
                                'bad';
    if (a.assignedCssLabel) {
        a.classList.add('assigned-label-' + a.assignedCssLabel);
        a.classList.add('has-assigned-label');
    }
}

function initLink(a) {
    var identifier = getIdentifier(a);
    if (!identifier) return;

    var label = knownLabels[identifier];
    if (label === undefined) {
        labelsToSolve.push({ element: a, identifier: identifier });
        return;
    }
    applyLabel(a, identifier);
}

var currentlySelectedEntity = null;

function isHostedOn(/** @type {string}*/fullHost, /** @type {string}*/baseHost) {
    if (baseHost.length > fullHost.length) return false;
    if (baseHost.length == fullHost.length) return baseHost == fullHost;
    var k = fullHost.charCodeAt(fullHost.length - baseHost.length - 1);
    if (k == 0x2E) return fullHost.endsWith(baseHost);
    else return false;
}

function getQuery(/** @type {string}*/search) {
    if (!search) return {};
    var s = {};
    if (search.startsWith('?')) search = search.substring(1);
    for (var pair of search.split('&')) {
        var z = pair.split('=');
        if (z.length != 2) continue;
        s[decodeURIComponent(z[0]).replace(/\+/g, ' ')] = decodeURIComponent(z[1].replace(/\+/g, ' '));
    }
    return s;
}

function takeFirstPathComponents(/** @type {string}*/path, /** @type {number}*/num) {
    var m = path.split('/')
    m = m.slice(1, 1 + num);
    if (m.length && !m[m.length - 1]) m.length--;
    return '/' + m.join('/');
}

function captureRegex(str, regex){
    if(!str) return null;
    var match = str.match(regex);
    if(match && match[1]) return match[1];
    return null;
}

function getCurrentFacebookPageId() {

    // page
    var elem = document.querySelector("a[rel=theater][aria-label='Profile picture']");
    if (elem) {
        var p = captureRegex(elem.href, /facebook\.com\/(\d+)/)
        if (p) return p;
    }

    // page (does not work if page is loaded directly)
    elem = document.querySelector("[ajaxify^='/page_likers_and_visitors_dialog']")
    if (elem) return captureRegex(elem.getAttribute('ajaxify'), /\/(\d+)\//);

    // group
    elem = document.querySelector("[id^='headerAction_']");
    if (elem) return captureRegex(elem.id, /_(\d+)/);

    // profile
    elem = document.querySelector('#pagelet_timeline_main_column');
    if (elem && elem.dataset.gt) return JSON.parse(elem.dataset.gt).profile_owner;
    return null;
}

function getIdentifier(urlstr) {
    try{
        return getIdentifierInternal(urlstr);
    }catch(e){
        console.warning("Unable to get identifier for " + urlstr);
        return null;
    }
}

function getIdentifierInternal(urlstr) {
    if (!urlstr) return null;

    if (hostname == 'facebook.com') {
        var parent = urlstr.parentElement;
        if (parent && (parent.tagName == 'H1' || parent.id == 'fb-timeline-cover-name')) {
            var id = getCurrentFacebookPageId();
            //console.log('Current fb page: ' + id)
            if (id)
                return 'facebook.com/' + id;
        }
        if (urlstr.dataset) {
            var hovercard = urlstr.dataset.hovercard;
            if (hovercard) {
                var id = captureRegex(hovercard, /id=(\d+)/);
                if (id)
                    return 'facebook.com/' + id;
            }
            var gt = urlstr.dataset.gt;
            if (gt) {
                var gtParsed = JSON.parse(gt);
                if (gtParsed.engagement && gtParsed.engagement.eng_tid) {
                    return 'facebook.com/' + gtParsed.engagement.eng_tid;
                }
            }
            var p = urlstr;
            while (p) {
                var bt = p.dataset.bt;
                if (bt) {
                    var btParsed = JSON.parse(bt);
                    if (btParsed.id) return 'facebook.com/' + btParsed.id;
                }
                p = p.parentElement;
            }
        }
    }
    if (urlstr.href !== undefined) urlstr = urlstr.href;
    if (!urlstr) return null;
    if (urlstr.endsWith('#')) return null;
    try {
        var url = new URL(urlstr);
    } catch (e) {
        return null;
    }
    if (url.protocol != 'http:' && url.protocol != 'https:') return null;

    if (url.href.indexOf('http', 1) != -1) {
        var s = getQuery(url.search);
        urlstr = null;
        for (var key in s) {
            if (s.hasOwnProperty(key)) {
                var element = s[key];
                if (element.startsWith('http:') || element.startsWith('https')) {
                    urlstr = element;
                    break;
                }
            }
        }
        if (urlstr == null) {
            urlstr = url.href.substring(url.href.indexOf('http', 1))
        }
        try {
            url = new URL(urlstr);
        } catch (e) { }
    }

    var host = url.hostname;
    if (isHostedOn(host, 'web.archive.org')) {
        var match = captureRegex(url.href, /\/web\/\w+\/(.*)/);
        if (!match) return null;
        url = new URL('http://' + match);
        host = url.hostname;
    }
    if (host.startsWith('www.')) host = host.substring(4);

    if (isHostedOn(host, 'facebook.com')) {
        var s = getQuery(url.search);
        var p = url.pathname.replace('/pg/', '/');
        return 'facebook.com/' + (s.story_fbid || s.set || s.story_fbid || s._ft_ || s.ft_id || s.id || takeFirstPathComponents(p, p.startsWith('/groups/') ? 2 : 1).substring(1));
    }
    if (isHostedOn(host, 'reddit.com')) {
        return 'reddit.com' + takeFirstPathComponents(url.pathname.replace('/u/', '/user/'), 2).toLowerCase();
    }
    if (isHostedOn(host, 'twitter.com')) {
        return 'twitter.com' + takeFirstPathComponents(url.pathname, 1).toLowerCase()
    }
    if (isHostedOn(host, 'youtube.com')) {
        return 'youtube.com' + takeFirstPathComponents(url.pathname, 2);
    }
    if (host.indexOf('.blogspot.') != -1) {
        var m = captureRegex(host, /([a-zA-Z0-9\-]*)\.blogspot/);
        if(m) return m.toLowerCase() + '.blogspot.com';
    }

    var id = host;
    if (id.startsWith('www.')) id = id.substr(4);
    if (id.startsWith('m.')) id = id.substr(2);
    return id.toLowerCase();
}


init();

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {

    if (message.updateAllLabels) {
        updateAllLabels(true);
        return;
    }
    message.contextPage = window.location.href;
    var target = message.elementId ? browser.menus.getTargetElement(message.elementId) : null;

    //console.log(message.url)
    var links = target ? [target] : [...document.getElementsByTagName('A')].filter(x => x.href == message.url)

    //if (!links.length) console.log('Already empty :(')
    var identifier = links.length ? getIdentifier(links[0]) : getIdentifier(message.url);
    if (!identifier) return;
    var snippets = links.map(node => {

        while (node) {
            var classList = node.classList;
            if (hostname == 'facebook.com' && node.dataset && node.dataset.ftr) return node;
            if (hostname == 'reddit.com' && (classList.contains('scrollerItem') || classList.contains('thing') || classList.contains('Comment'))) return node;
            if (hostname == 'twitter.com' && (classList.contains('stream-item'))) return node;
            node = node.parentElement;
        }
        //console.log('Reached the top without a satisfying element')
        return null;
    })
    snippets = snippets.filter((item, pos) => item && snippets.indexOf(item) == pos);
    message.identifier = identifier;
    message.snippets = snippets.filter((item, pos) => pos <= 10).map(x => x.outerHTML);
    sendResponse(message);
})