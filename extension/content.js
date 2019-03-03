var browser = browser || chrome;

var hostname = typeof (location) != 'undefined' ? location.hostname : '';
if (hostname.startsWith('www.')) {
    hostname = hostname.substring(4);
}
if (hostname.endsWith('.reddit.com')) hostname = 'reddit.com';
if (hostname.endsWith('.facebook.com')) hostname = 'facebook.com';
if (hostname.endsWith('.youtube.com')) hostname = 'youtube.com';


var myself = null;

function fixupSiteStyles() {
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
    if (hostname == 'medium.com') {


        var style = document.createElement('style');
        style.textContent = `

        a.show-thread-link, a.ThreadedConversation-moreRepliesLink {
            color: inherit !important;
        }
        .fullname,
        .stream-item a:hover .fullname,
        .stream-item a:active .fullname
        {color:inherit;}
        
        `;
        document.head.appendChild(style);

    }
    if (isHostedOn(hostname, 'tumblr.com')) {
        var style = document.createElement('style');
        style.textContent = `
        .assigned-label-transphobic { outline: 2px solid #991515 !important; }
        .assigned-label-t-friendly { outline: 1px solid #77B91E !important; }
        `;
        document.head.appendChild(style);
    }
    if(hostname.indexOf('wiki') != -1){
        var style = document.createElement('style');
        style.textContent = `
        .assigned-label-transphobic { outline: 1px solid #991515 !important; }
        .assigned-label-t-friendly { outline: 1px solid #77B91E !important; }
        
        `;
        document.head.appendChild(style);
    }
    if (hostname == 'twitter.com') {
        myself = document.querySelector('.DashUserDropdown-userInfo a');

        var style = document.createElement('style');
        style.textContent = `

        .pretty-link b, .pretty-link s {
            color: inherit !important;
        }
        
        a.show-thread-link, a.ThreadedConversation-moreRepliesLink {
            color: inherit !important;
        }
        .fullname,
        .stream-item a:hover .fullname,
        .stream-item a:active .fullname
        {color:inherit;}
        
        `;
        document.head.appendChild(style);

    } else if (hostname == 'reddit.com') {
        var style = document.createElement('style');
        style.textContent = `
    .author { color: #369 !important;}
        `;
        document.head.appendChild(style);
    }
}

function maybeDisableCustomCss() {
    var shouldDisable = null;
    if (hostname == 'twitter.com') shouldDisable = x => x.ownerNode && x.ownerNode.id && x.ownerNode.id.startsWith('user-style');
    else if (hostname == 'medium.com') shouldDisable = x => x.ownerNode && x.ownerNode.className && x.ownerNode.className == 'js-collectionStyle';
    else if (hostname == 'disqus.com') shouldDisable = x => x.ownerNode && x.ownerNode.id && x.ownerNode.id.startsWith('css_');

    if (shouldDisable)
        [...document.styleSheets].filter(shouldDisable).forEach(x => x.disabled = true);
}

function init() {
    fixupSiteStyles();

    if (isHostedOn(hostname, 'youtube.com')) {
        setInterval(updateYouTubeChannelHeader, 300);
    }

    if (myself && (myself.href || myself.startsWith('http:') || myself.startsWith('https:')))
        myself = getIdentifier(myself);
    console.log('Self: ' + myself)



    maybeDisableCustomCss();
    updateAllLabels();

    var observer = new MutationObserver(mutationsList => {
        maybeDisableCustomCss();
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


    document.addEventListener('contextmenu', evt => {
        lastRightClickedElement = evt.target;
    }, true);
}

var lastRightClickedElement = null;
var lastAppliedYouTubeUrl = null;
var lastAppliedYouTubeTitle = null;

function updateYouTubeChannelHeader() {
    var url = window.location.href;
    var title = document.getElementById('channel-title');
    if (title && title.tagName == 'H3') title = null; // search results, already a link
    var currentTitle = title ? title.textContent : null;

    if (url == lastAppliedYouTubeUrl && currentTitle == lastAppliedYouTubeTitle) return;
    lastAppliedYouTubeUrl = url;
    lastAppliedYouTubeTitle = currentTitle;

    if (currentTitle) {
        var replacement = document.getElementById('channel-title-replacement');
        if (!replacement) {
            replacement = document.createElement('A');
            replacement.id = 'channel-title-replacement'
            replacement.className = title.className;
            title.parentNode.insertBefore(replacement, title.nextSibling);
            title.style.display = 'none';
            replacement.style.fontSize = '2.4rem';
            replacement.style.fontWeight = '400';
            replacement.style.lineHeight = '3rem';
            replacement.style.textDecoration = 'none';
        }
        replacement.textContent = lastAppliedYouTubeTitle;
        replacement.href = lastAppliedYouTubeUrl;
    }
    updateAllLabels();
    setTimeout(updateAllLabels, 2000);
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

    a.assignedCssLabel = knownLabels[identifier] || '';

    if (a.assignedCssLabel) {
        a.classList.add('assigned-label-' + a.assignedCssLabel);
        a.classList.add('has-assigned-label');
        if (hostname == 'twitter.com')
            a.classList.remove('u-textInheritColor');
    }
}

function initLink(a) {
    var identifier = getIdentifier(a);
    if (!identifier){
        if(hostname == 'youtube.com')
            applyLabel(a, '');
        return;
    }

    var label = knownLabels[identifier];
    if (label === undefined) {
        labelsToSolve.push({ element: a, identifier: identifier });
        return;
    }
    applyLabel(a, identifier);
}

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
    if (m.length != num) return '!!'
    return '/' + m.join('/');
}
function takeNthPathComponent(/** @type {string}*/path, /** @type {number}*/nth) {
    return path.split('/')[nth + 1] || null;
}

function captureRegex(str, regex) {
    if (!str) return null;
    var match = str.match(regex);
    if (match && match[1]) return match[1];
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
    try {
        var k = getIdentifierInternal(urlstr);
        if (!k || k.indexOf('!') != -1) return null;
        return k.toLowerCase();
    } catch (e) {
        console.warn("Unable to get identifier for " + urlstr);
        return null;
    }
}

function getIdentifierInternal(urlstr) {
    if (!urlstr) return null;

    if (hostname == 'reddit.com') {
        var parent = urlstr.parentElement;
        if (parent && parent.classList.contains('domain') && urlstr.textContent.startsWith('self.')) return null;
    }
    if (hostname == 'disqus.com') {
        if (urlstr.classList && urlstr.classList.contains('time-ago')) return null;
    }

    if (hostname == 'facebook.com' && urlstr.tagName) {
        var parent = urlstr.parentElement;
        if (parent && (parent.tagName == 'H1' || parent.id == 'fb-timeline-cover-name')) {
            var id = getCurrentFacebookPageId();
            //console.log('Current fb page: ' + id)
            if (id)
                return 'facebook.com/' + id;
        }

        // comment timestamp
        if (urlstr.firstChild && urlstr.firstChild.tagName == 'ABBR' && urlstr.lastChild == urlstr.firstChild) return null;
        
        // post 'see more'
        if (urlstr.classList.contains('see_more_link')) return null;

        // post 'continue reading'
        if (parent && parent.classList.contains('text_exposed_link')) return null;


        if (urlstr.dataset) {
            var hovercard = urlstr.dataset.hovercard;
            if (hovercard) {
                var id = captureRegex(hovercard, /id=(\d+)/);
                if (id)
                    return 'facebook.com/' + id;
            }

            // post Comments link
            if (urlstr.dataset.testid == 'UFI2CommentsCount/root') return null;
            
            // post Comments link
            if (urlstr.dataset.commentPreludeRef) return null;

            // page left sidebar
            if (urlstr.dataset.endpoint) return null;

            // profile tabs
            if (urlstr.dataset.tabKey) return null;

            var gt = urlstr.dataset.gt;
            if (gt) {
                var gtParsed = JSON.parse(gt);
                if (gtParsed.engagement && gtParsed.engagement.eng_tid) {
                    return 'facebook.com/' + gtParsed.engagement.eng_tid;
                }
            }

            // comment interaction buttons
            if (urlstr.dataset.sigil) return null;

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
    if (urlstr.dataset && urlstr.dataset.expandedUrl) urlstr = urlstr.dataset.expandedUrl;
    if (urlstr.href !== undefined) urlstr = urlstr.href;
    if (!urlstr) return null;
    if (urlstr.endsWith('#')) return null;
    try {
        var url = new URL(urlstr);
    } catch (e) {
        return null;
    }
    if (url.protocol != 'http:' && url.protocol != 'https:') return null;

    // fb group member badge
    if (url.pathname.includes('/badge_member_list/')) return null;

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
        return getIdentifierInternal('http://' + match);
    }
    if (url.search && url.search.includes('http')) {
        if (url.pathname.startsWith('/intl/')) return null; // facebook language switch links
        for (var q of url.searchParams) {
            if (q[1].startsWith('http')) return getIdentifierInternal(q[1]);
        }
    }
    /*
    if(host == 't.umblr.com'){
        return getIdentifierInternal(url.searchParams.get('z'));
    }
    */
    if (host.startsWith('www.')) host = host.substring(4);

    if (isHostedOn(host, 'facebook.com')) {
        var s = getQuery(url.search);
        var p = url.pathname.replace('/pg/', '/');
        return 'facebook.com/' + (s.id || takeFirstPathComponents(p, p.startsWith('/groups/') ? 2 : 1).substring(1));
    }
    if (isHostedOn(host, 'reddit.com')) {
        var pathname = url.pathname.replace('/u/', '/user/');
        if (!pathname.startsWith('/user/') && !pathname.startsWith('/r/')) return null;
        if(pathname.includes('/comments/')) return null;
        return 'reddit.com' + takeFirstPathComponents(pathname, 2);
    }
    if (isHostedOn(host, 'twitter.com')) {
        return 'twitter.com' + takeFirstPathComponents(url.pathname, 1);
    }
    if (isHostedOn(host, 'youtube.com')) {
        var pathname = url.pathname;
        if (!pathname.startsWith('/user/') && !pathname.startsWith('/channel/')) return null;
        return 'youtube.com' + takeFirstPathComponents(url.pathname, 2);
    }
    if (isHostedOn(host, 'disqus.com') && url.pathname.startsWith('/by/')) {
        return 'disqus.com' + takeFirstPathComponents(url.pathname, 2);
    }
    if (isHostedOn(host, 'medium.com')) {
        return 'medium.com' + takeFirstPathComponents(url.pathname, 1);
    }
    if (isHostedOn(host, 'tumblr.com')) {
        if (url.pathname.startsWith('/register/follow/')) {
            var name = takeNthPathComponent(url.pathname, 2);
            return name ? name + '.tumblr.com' : null;
        }
        if (host != 'www.tumblr.com' && host != 'assets.tumblr.com' && host.indexOf('.media.') == -1) {
            if (!url.pathname.startsWith('/tagged/')) return url.host;
        }
        return null;
    }
    if (isHostedOn(host, 'wikipedia.org') || isHostedOn(host, 'rationalwiki.org')) {
        if (url.hash || url.pathname.includes(':')) return null;
        if (url.pathname.startsWith('/wiki/')) return 'wikipedia.org' + takeFirstPathComponents(url.pathname, 2);
        else return null;
    }
    if (host.indexOf('.blogspot.') != -1) {
        var m = captureRegex(host, /([a-zA-Z0-9\-]*)\.blogspot/);
        if (m) return m + '.blogspot.com';
    }

    var id = host;
    if (id.startsWith('www.')) id = id.substr(4);
    if (id.startsWith('m.')) id = id.substr(2);
    return id;
}


init();

var lastGeneratedLinkId = 0;

function getSnippet(node){
    while (node) {
        var classList = node.classList;
        if (hostname == 'facebook.com' && node.dataset && node.dataset.ftr) return node;
        if (hostname == 'reddit.com' && (classList.contains('scrollerItem') || classList.contains('thing') || classList.contains('Comment'))) return node;
        if (hostname == 'twitter.com' && (classList.contains('stream-item'))) return node;
        if (hostname == 'disqus.com' && (classList.contains('post-content'))) return node;
        if (hostname == 'medium.com' && (classList.contains('streamItem') || classList.contains('streamItemConversationItem'))) return node;
        if (hostname == 'youtube.com' && node.tagName == 'YTD-COMMENT-RENDERER') return node;
        if (hostname.endsWith('tumblr.com') && (node.dataset.postId || classList.contains('post'))) return node;

        node = node.parentElement;
    }
    return null;
}


browser.runtime.onMessage.addListener((message, sender, sendResponse) => {

    if (message.updateAllLabels) {
        updateAllLabels(true);
        return;
    }
    
    message.contextPage = window.location.href;
    var target = lastRightClickedElement; // message.elementId ? browser.menus.getTargetElement(message.elementId) : null;
    
    while(target){
        if(target.href) break;
        target = target.parentElement;
    }

    if (target && target.href != message.url) target = null;

    var identifier = target ? getIdentifier(target) : getIdentifier(message.url);
    if (!identifier) return;

    message.identifier = identifier;
    if (identifier.startsWith('facebook.com/'))
        message.secondaryIdentifier = getIdentifier(message.url);

    var snippet = getSnippet(target);    
    message.linkId = ++lastGeneratedLinkId;

    if (target) 
        target.setAttribute('shinigami-eyes-link-id', lastGeneratedLinkId);

    message.snippet = snippet ? snippet.outerHTML : null;
    var debugClass = 'shinigami-eyes-debug-snippet-highlight';
    
    if (snippet && message.debug) {
        snippet.classList.add(debugClass);
        if (message.debug <= 1)
            setTimeout(() => snippet.classList.remove(debugClass), 1500)
    }
    sendResponse(message);
})