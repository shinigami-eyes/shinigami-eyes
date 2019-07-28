var browser: Browser = browser || chrome;

var hostname = typeof (location) != 'undefined' ? location.hostname : '';
if (hostname.startsWith('www.')) {
    hostname = hostname.substring(4);
}
if (hostname.endsWith('.reddit.com')) hostname = 'reddit.com';
if (hostname.endsWith('.facebook.com')) hostname = 'facebook.com';
if (hostname.endsWith('.youtube.com')) hostname = 'youtube.com';

var myself: string = null;

function fixupSiteStyles() {
    if (hostname == 'facebook.com') {
        let m = document.querySelector("[id^='profile_pic_header_']")
        if (m) myself = 'facebook.com/' + captureRegex(m.id, /header_(\d+)/);
    } else if (hostname == 'medium.com') {
        addStyleSheet(`
            a.show-thread-link, a.ThreadedConversation-moreRepliesLink {
                color: inherit !important;
            }
            .fullname,
            .stream-item a:hover .fullname,
            .stream-item a:active .fullname
            {color:inherit;}
        `);
    } else if (domainIs(hostname, 'tumblr.com')) {
        addStyleSheet(`
            .assigned-label-transphobic { outline: 2px solid var(--ShinigamiEyesTransphobic) !important; }
            .assigned-label-t-friendly { outline: 1px solid var(--ShinigamiEyesTFriendly) !important; }
        `);
    } else if (hostname.indexOf('wiki') != -1) {
        addStyleSheet(`
            .assigned-label-transphobic { outline: 1px solid var(--ShinigamiEyesTransphobic) !important; }
            .assigned-label-t-friendly { outline: 1px solid var(--ShinigamiEyesTFriendly) !important; }
        `);
    } else if (hostname == 'twitter.com') {
        myself = getIdentifier(<HTMLAnchorElement>document.querySelector('.DashUserDropdown-userInfo a'));
        addStyleSheet(`
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
        `);
    } else if (hostname == 'reddit.com') {
        myself = getIdentifier(<HTMLAnchorElement>document.querySelector('#header-bottom-right .user a'));
        if (!myself) {
            let m = document.querySelector('#USER_DROPDOWN_ID');
            if (m) {
                let username = [...m.querySelectorAll('*')].filter(x => x.childNodes.length == 1 && x.firstChild.nodeType == 3).map(x => x.textContent)[0]
                if (username) myself = 'reddit.com/user/' + username;
            }
        }
        addStyleSheet(`
            .author { color: #369 !important;}
        `);
    }
}

function addStyleSheet(css: string) {
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
}

function maybeDisableCustomCss() {
    var shouldDisable: (s: { ownerNode: HTMLElement }) => boolean = null;
    if (hostname == 'twitter.com') shouldDisable = x => x.ownerNode && x.ownerNode.id && x.ownerNode.id.startsWith('user-style');
    else if (hostname == 'medium.com') shouldDisable = x => x.ownerNode && x.ownerNode.className && x.ownerNode.className == 'js-collectionStyle';
    else if (hostname == 'disqus.com') shouldDisable = x => x.ownerNode && x.ownerNode.id && x.ownerNode.id.startsWith('css_');

    if (shouldDisable)
        [...document.styleSheets].filter(<any>shouldDisable).forEach(x => x.disabled = true);
}

function init() {
    fixupSiteStyles();

    if (domainIs(hostname, 'youtube.com')) {
        setInterval(updateYouTubeChannelHeader, 300);
        setInterval(updateAllLabels, 6000);
    }

    console.log('Self: ' + myself)

    maybeDisableCustomCss();
    updateAllLabels();

    var observer = new MutationObserver(mutationsList => {
        maybeDisableCustomCss();
        for (const mutation of mutationsList) {
            if (mutation.type == 'childList') {
                for (const node of mutation.addedNodes) {
                    if (node instanceof HTMLAnchorElement) {
                        initLink(node);
                    }
                    if (node instanceof HTMLElement) {
                        for (const subnode of node.querySelectorAll('a')) {
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
        lastRightClickedElement = <HTMLElement>evt.target;
    }, true);
}

var lastRightClickedElement: HTMLElement = null;
var lastAppliedYouTubeUrl: string = null;
var lastAppliedYouTubeTitle: string = null;

function updateYouTubeChannelHeader() {
    var url = window.location.href;
    var title = document.getElementById('channel-title');
    if (title && title.tagName == 'H3') title = null; // search results, already a link
    var currentTitle = title ? title.textContent : null;

    if (url == lastAppliedYouTubeUrl && currentTitle == lastAppliedYouTubeTitle) return;
    lastAppliedYouTubeUrl = url;
    lastAppliedYouTubeTitle = currentTitle;

    if (currentTitle) {
        var replacement = <HTMLAnchorElement>document.getElementById('channel-title-replacement');
        if (!replacement) {
            replacement = <HTMLAnchorElement>document.createElement('A');
            replacement.id = 'channel-title-replacement'
            replacement.className = title.className;
            title.parentNode.insertBefore(replacement, title.nextSibling);
            title.style.display = 'none';
            replacement.style.fontSize = '2.4rem';
            replacement.style.fontWeight = '400';
            replacement.style.lineHeight = '3rem';
            replacement.style.textDecoration = 'none';
            replacement.style.color = 'black';
        }
        replacement.textContent = lastAppliedYouTubeTitle;
        replacement.href = lastAppliedYouTubeUrl;
    }
    updateAllLabels();
    setTimeout(updateAllLabels, 2000);
    setTimeout(updateAllLabels, 4000);
}

function updateAllLabels(refresh?: boolean) {
    if (refresh) knownLabels = {};
    for (const a of document.getElementsByTagName('a')) {
        initLink(a);
    }
    solvePendingLabels();
}

var knownLabels: LabelMap = {};
var currentlyAppliedTheme = '_none_';

var labelsToSolve: LabelToSolve[] = [];
function solvePendingLabels() {
    if (!labelsToSolve.length) return;
    var uniqueIdentifiers = Array.from(new Set(labelsToSolve.map(x => x.identifier)));
    var tosolve = labelsToSolve;
    labelsToSolve = [];
    browser.runtime.sendMessage<ShinigamiEyesCommand, LabelMap>({ ids: uniqueIdentifiers, myself: <string>myself }, (response: LabelMap) => {
        const theme = response[':theme'];
        if (theme != currentlyAppliedTheme) {
            if (currentlyAppliedTheme) document.body.classList.remove('shinigami-eyes-theme-' + currentlyAppliedTheme);
            if (theme) document.body.classList.add('shinigami-eyes-theme-' + theme);
            currentlyAppliedTheme = theme;
        }
        for (const item of tosolve) {
            const label = response[item.identifier];
            knownLabels[item.identifier] = label || '';
            applyLabel(item.element, item.identifier);
        }
    });
}

function applyLabel(a: HTMLAnchorElement, identifier: string) {
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

function initLink(a: HTMLAnchorElement) {
    var identifier = getIdentifier(a);
    if (!identifier) {
        if (hostname == 'youtube.com')
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

function domainIs(host: string, baseDomain: string) {
    if (baseDomain.length > host.length) return false;
    if (baseDomain.length == host.length) return baseDomain == host;
    var k = host.charCodeAt(host.length - baseDomain.length - 1);
    if (k == 0x2E /* . */) return host.endsWith(baseDomain);
    else return false;
}

function getPartialPath(path: string, num: number) {
    var m = path.split('/')
    m = m.slice(1, 1 + num);
    if (m.length && !m[m.length - 1]) m.length--;
    if (m.length != num) return '!!'
    return '/' + m.join('/');
}
function getPathPart(path: string, index: number) {
    return path.split('/')[index + 1] || null;
}

function captureRegex(str: string, regex: RegExp) {
    if (!str) return null;
    var match = str.match(regex);
    if (match && match[1]) return match[1];
    return null;
}

function getCurrentFacebookPageId() {

    // page
    var elem = <HTMLAnchorElement>document.querySelector("a[rel=theater][aria-label='Profile picture']");
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

function getIdentifier(link: string | HTMLAnchorElement) {
    try {
        var k = link instanceof Node ? getIdentifierFromElementImpl(link) : getIdentifierFromURLImpl(tryParseURL(link));
        if (!k || k.indexOf('!') != -1) return null;
        return k.toLowerCase();
    } catch (e) {
        console.warn("Unable to get identifier for " + link);
        return null;
    }
}

function getIdentifierFromElementImpl(element: HTMLAnchorElement): string {
    if (!element) return null;

    const dataset = element.dataset;

    if (hostname == 'reddit.com') {
        const parent = element.parentElement;
        if (parent && parent.classList.contains('domain') && element.textContent.startsWith('self.')) return null;
    } else if (hostname == 'disqus.com') {
        if (element.classList && element.classList.contains('time-ago')) return null;
    } else if (hostname == 'facebook.com') {
        const parent = element.parentElement;
        if (parent && (parent.tagName == 'H1' || parent.id == 'fb-timeline-cover-name')) {
            const id = getCurrentFacebookPageId();
            //console.log('Current fb page: ' + id)
            if (id)
                return 'facebook.com/' + id;
        }

        // comment timestamp
        if (element.firstChild && (<HTMLElement>element.firstChild).tagName == 'ABBR' && element.lastChild == element.firstChild) return null;

        // post 'see more'
        if (element.classList.contains('see_more_link')) return null;

        // post 'continue reading'
        if (parent && parent.classList.contains('text_exposed_link')) return null;


        if (dataset) {
            const hovercard = dataset.hovercard;
            if (hovercard) {
                const id = captureRegex(hovercard, /id=(\d+)/);
                if (id)
                    return 'facebook.com/' + id;
            }

            // post Comments link
            if (dataset.testid == 'UFI2CommentsCount/root') return null;

            // notification
            if (dataset.testid == 'notif_list_item_link') return null;

            // post Comments link
            if (dataset.commentPreludeRef) return null;

            // page left sidebar
            if (dataset.endpoint) return null;

            // profile tabs
            if (dataset.tabKey) return null;

            const gt = dataset.gt;
            if (gt) {
                const gtParsed = JSON.parse(gt);
                if (gtParsed.engagement && gtParsed.engagement.eng_tid) {
                    return 'facebook.com/' + gtParsed.engagement.eng_tid;
                }
            }

            // comment interaction buttons
            if (dataset.sigil) return null;

            let p = <HTMLElement>element;
            while (p) {
                const bt = p.dataset.bt;
                if (bt) {
                    const btParsed = JSON.parse(bt);
                    if (btParsed.id) return 'facebook.com/' + btParsed.id;
                }
                p = p.parentElement;
            }
        }
    }
    if (dataset && dataset.expandedUrl) return getIdentifierFromURLImpl(tryParseURL(dataset.expandedUrl));

    if (element.classList.contains('tumblelog')) return element.textContent.substr(1) + '.tumblr.com';

    const href = element.href;
    if (href && !href.endsWith('#')) return getIdentifierFromURLImpl(tryParseURL(href));
    return null;
}

function tryParseURL(urlstr: string) {
    if (!urlstr) return null;
    try {
        const url = new URL(urlstr);
        if (url.protocol != 'http:' && url.protocol != 'https:') return null;
        return url;
    } catch (e) {
        return null;
    }
}

function getIdentifierFromURLImpl(url: URL): string {
    if (!url) return null;

    // nested urls
    if (url.href.indexOf('http', 1) != -1) {
        if (url.pathname.startsWith('/intl/')) return null; // facebook language switch links

        // const values = url.searchParams.values()
        // HACK: values(...) is not iterable on facebook (babel polyfill?)
        const values = url.search.split('&').map(x => {
            const eq = x.indexOf('=');
            return eq == -1 ? '' : decodeURIComponent(x.substr(eq + 1));
        });

        for (const value of values) {
            if (value.startsWith('http:') || value.startsWith('https:')) {
                return getIdentifierFromURLImpl(tryParseURL(value));
            }
        }
        const newurl = tryParseURL(url.href.substring(url.href.indexOf('http', 1)));
        if (newurl) return getIdentifierFromURLImpl(newurl);
    }

    // fb group member badge
    if (url.pathname.includes('/badge_member_list/')) return null;

    let host = url.hostname;
    const searchParams = url.searchParams;
    if (domainIs(host, 'web.archive.org')) {
        const match = captureRegex(url.href, /\/web\/\w+\/(.*)/);
        if (!match) return null;
        return getIdentifierFromURLImpl(tryParseURL('http://' + match));
    }

    if (host.startsWith('www.')) host = host.substring(4);

    if (domainIs(host, 'facebook.com')) {
        const fbId = searchParams.get('id');
        const p = url.pathname.replace('/pg/', '/');
        return 'facebook.com/' + (fbId || getPartialPath(p, p.startsWith('/groups/') ? 2 : 1).substring(1));
    } else if (domainIs(host, 'reddit.com')) {
        const pathname = url.pathname.replace('/u/', '/user/');
        if (!pathname.startsWith('/user/') && !pathname.startsWith('/r/')) return null;
        if (pathname.includes('/comments/') && hostname == 'reddit.com') return null;
        return 'reddit.com' + getPartialPath(pathname, 2);
    } else if (domainIs(host, 'twitter.com')) {
        return 'twitter.com' + getPartialPath(url.pathname, 1);
    } else if (domainIs(host, 'youtube.com')) {
        const pathname = url.pathname.replace('/c/', '/user/');
        if (!pathname.startsWith('/user/') && !pathname.startsWith('/channel/')) return null;
        return 'youtube.com' + getPartialPath(pathname, 2);
    } else if (domainIs(host, 'disqus.com') && url.pathname.startsWith('/by/')) {
        return 'disqus.com' + getPartialPath(url.pathname, 2);
    } else if (domainIs(host, 'medium.com')) {
        return 'medium.com' + getPartialPath(url.pathname.replace('/t/', '/'), 1);
    } else if (domainIs(host, 'tumblr.com')) {
        if (url.pathname.startsWith('/register/follow/')) {
            const name = getPathPart(url.pathname, 2);
            return name ? name + '.tumblr.com' : null;
        }
        if (host != 'www.tumblr.com' && host != 'assets.tumblr.com' && host.indexOf('.media.') == -1) {
            if (!url.pathname.startsWith('/tagged/')) return url.host;
        }
        return null;
    } else if (domainIs(host, 'wikipedia.org') || domainIs(host, 'rationalwiki.org')) {
        if (url.hash || url.pathname.includes(':')) return null;
        if (url.pathname.startsWith('/wiki/')) return 'wikipedia.org' + getPartialPath(url.pathname, 2);
        else return null;
    } else if (host.indexOf('.blogspot.') != -1) {
        const m = captureRegex(host, /([a-zA-Z0-9\-]*)\.blogspot/);
        if (m) return m + '.blogspot.com';
        else return null;
    } else if(host.includes('google.')){
        if(url.pathname == '/search' && searchParams.get('stick') && !searchParams.get('tbm') && !searchParams.get('start')){
            const q = searchParams.get('q');
            if(q) return 'wikipedia.org/wiki/' + q.replace(/\s/g, '_');
        }
        return null;
    } else {
        if (host.startsWith('m.')) host = host.substr(2);
        return host;
    }
}


init();

var lastGeneratedLinkId = 0;

function getSnippet(node: HTMLElement) {
    while (node) {
        var classList = node.classList;
        if (hostname == 'facebook.com' && node.dataset && node.dataset.ftr) return node;
        if (hostname == 'reddit.com' && (classList.contains('scrollerItem') || classList.contains('thing') || classList.contains('Comment'))) return node;
        if (hostname == 'twitter.com' && (classList.contains('stream-item') || classList.contains('permalink-tweet-container') || node.tagName == 'ARTICLE')) return node;
        if (hostname == 'disqus.com' && (classList.contains('post-content'))) return node;
        if (hostname == 'medium.com' && (classList.contains('streamItem') || classList.contains('streamItemConversationItem'))) return node;
        if (hostname == 'youtube.com' && node.tagName == 'YTD-COMMENT-RENDERER') return node;
        if (hostname.endsWith('tumblr.com') && (node.dataset.postId || classList.contains('post'))) return node;

        node = node.parentElement;
    }
    return null;
}


browser.runtime.onMessage.addListener<ShinigamiEyesMessage, ShinigamiEyesSubmission>((message, sender, sendResponse) => {

    if (message.updateAllLabels) {
        updateAllLabels(true);
        return;
    }

    message.contextPage = window.location.href;
    var target = lastRightClickedElement; // message.elementId ? browser.menus.getTargetElement(message.elementId) : null;

    while (target) {
        if ((<HTMLAnchorElement>target).href) break;
        target = target.parentElement;
    }

    if (target && (<HTMLAnchorElement>target).href != message.url) target = null;

    var identifier = target ? getIdentifier(<HTMLAnchorElement>target) : getIdentifier(message.url);
    if (!identifier) return;

    message.identifier = identifier;
    if (identifier.startsWith('facebook.com/'))
        message.secondaryIdentifier = getIdentifier(message.url);

    var snippet = getSnippet(target);
    message.linkId = ++lastGeneratedLinkId;

    if (target)
        target.setAttribute('shinigami-eyes-link-id', '' + lastGeneratedLinkId);

    message.snippet = snippet ? snippet.outerHTML : null;
    var debugClass = 'shinigami-eyes-debug-snippet-highlight';

    if (snippet && message.debug) {
        snippet.classList.add(debugClass);
        if (message.debug <= 1)
            setTimeout(() => snippet.classList.remove(debugClass), 1500)
    }
    sendResponse(message);
})