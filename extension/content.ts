var browser: Browser = browser || chrome;

var hostname = typeof (location) != 'undefined' ? location.hostname : '';
if (hostname.startsWith('www.')) {
    hostname = hostname.substring(4);
}
if (hostname == 'mobile.twitter.com') hostname = 'twitter.com';
if (hostname.endsWith('.reddit.com')) hostname = 'reddit.com';
if (hostname.endsWith('.facebook.com')) hostname = 'facebook.com';
if (hostname.endsWith('.youtube.com')) hostname = 'youtube.com';

var myself: string = null;
var isSocialNetwork: boolean = null;

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
    } else if (hostname == 'rationalwiki.org' || domainIs(hostname, 'wikipedia.org')) {
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
    isSocialNetwork = [
        'facebook.com',
        'youtube.com',
        'reddit.com',
        'twitter.com',
        'medium.com',
        'disqus.com',
        'rationalwiki.org',
        'duckduckgo.com',
        'bing.com',
    ].includes(hostname) ||
        domainIs(hostname, 'tumblr.com') ||
        domainIs(hostname, 'wikipedia.org') ||
        /^google(\.co)?\.\w+$/.test(hostname);

    fixupSiteStyles();

    if (domainIs(hostname, 'youtube.com')) {
        setInterval(updateYouTubeChannelHeader, 300);
        setInterval(updateAllLabels, 6000);
    }
    if (hostname == 'twitter.com') {
        setInterval(updateTwitterClasses, 800);
    }

    console.log('Self: ' + myself)

    document.addEventListener('contextmenu', evt => {
        lastRightClickedElement = <HTMLElement>evt.target;
    }, true);

    maybeDisableCustomCss();
    updateAllLabels();

    if (isSocialNetwork) {
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
    }
}

var lastRightClickedElement: HTMLElement = null;
var lastAppliedYouTubeUrl: string = null;
var lastAppliedYouTubeTitle: string = null;

var lastAppliedTwitterUrl: string = null;

function updateTwitterClasses() {
    if (location.href != lastAppliedTwitterUrl) {
        setTimeout(updateAllLabels, 200);
        lastAppliedTwitterUrl = location.href;
    }
    for (const a of document.querySelectorAll('a')) {
        if (a.assignedCssLabel && !a.classList.contains('has-assigned-label')) {
            a.classList.add('assigned-label-' + a.assignedCssLabel);
            a.classList.add('has-assigned-label');
        }
    }
}

function updateYouTubeChannelHeader() {
    var url = window.location.href;
    var title = <HTMLElement>document.querySelector('#channel-header ytd-channel-name yt-formatted-string');
    if (title && !title.parentElement.offsetParent) title = null;
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
            replacement.style.color = 'var(--yt-spec-text-primary)';
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
    if (isSocialNetwork) {
        for (const a of document.getElementsByTagName('a')) {
            initLink(a);
        }
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
        if (hostname == 'youtube.com' || hostname == 'twitter.com')
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

function getIdentifier(link: string | HTMLAnchorElement, originalTarget?: HTMLElement) {
    try {
        var k = link instanceof Node ? getIdentifierFromElementImpl(link, originalTarget) : getIdentifierFromURLImpl(tryParseURL(link));
        if (!k || k.indexOf('!') != -1) return null;
        return k.toLowerCase();
    } catch (e) {
        console.warn("Unable to get identifier for " + link);
        return null;
    }
}

function isFacebookPictureLink(element: HTMLAnchorElement) { 
    var href = element.href;
    return href && (href.includes('/photo/') || href.includes('/photo.php'));
}

function getIdentifierFromElementImpl(element: HTMLAnchorElement, originalTarget: HTMLElement): string {
    if (!element) return null;

    const dataset = element.dataset;

    if (hostname == 'reddit.com') {
        const parent = element.parentElement;
        if (parent && parent.classList.contains('domain') && element.textContent.startsWith('self.')) return null;
    } else if (hostname == 'disqus.com') {
        if (element.classList && element.classList.contains('time-ago')) return null;
    } else if (hostname == 'facebook.com') {
        const parent = element.parentElement;
        const firstChild = <HTMLElement>element.firstChild;
        if (parent && (parent.tagName == 'H1' || parent.id == 'fb-timeline-cover-name')) {
            const id = getCurrentFacebookPageId();
            //console.log('Current fb page: ' + id)
            if (id)
                return 'facebook.com/' + id;
        }

        // comment timestamp
        if (firstChild && firstChild.tagName == 'ABBR' && element.lastChild == firstChild) return null;

        // post 'see more'
        if (element.classList.contains('see_more_link')) return null;

        // post 'continue reading'
        if (parent && parent.classList.contains('text_exposed_link')) return null;

        // React comment timestamp
        if (parent && parent.tagName == 'LI') return null;

        // React post timestamp
        if (element.getAttribute('role') == 'link' && parent && parent.tagName == 'SPAN' && firstChild && firstChild.tagName == 'SPAN' && firstChild.tabIndex == 0) 
            return null;

        // React big profile picture (user or page)
        if (originalTarget instanceof SVGImageElement && isFacebookPictureLink(element) && !getMatchingAncestorByCss(element, '[role=article]')) {
            return getIdentifier(window.location.href);
        }

        // React cover picture
        if (originalTarget instanceof HTMLImageElement && isFacebookPictureLink(element) && element.getAttribute('aria-label') && !getMatchingAncestorByCss(element, '[role=article]')) { 
            return getIdentifier(window.location.href);
        }

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
    } else if (hostname == 'twitter.com') {
        if (dataset && dataset.expandedUrl) return getIdentifier(dataset.expandedUrl);
        if (element.href.startsWith('https://t.co/')) {
            const title = element.title;
            if (title && (title.startsWith('http://') || title.startsWith('https://')))
                return getIdentifier(title);
            const content = element.textContent;
            if (!content.includes(' ') && content.includes('.') && !content.includes('…')) {
                const url = content.startsWith('http://') || content.startsWith('https://') ? content : 'http://' + content;
                return getIdentifier(url);
            }
        }
    } else if (domainIs(hostname, 'wikipedia.org')) {
        if (element.classList.contains('interlanguage-link-target')) return null;
    }

    if (element.classList.contains('tumblelog')) return element.textContent.replace('@', '') + '.tumblr.com';

    const href = element.href;
    if (href && (!href.endsWith('#') || href.includes('&stick='))) return getIdentifierFromURLImpl(tryParseURL(href));
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

function tryUnwrapNestedURL(url: URL): URL {
    if (!url) return null;
    if (url.href.indexOf('http', 1) != -1) {
        if (url.pathname.startsWith('/intl/')) return null; // facebook language switch links

        // const values = url.searchParams.values()
        // HACK: values(...) is not iterable on facebook (babel polyfill?)
        const values = url.search.split('&').map(x => {
            if (x.startsWith('ref_url=')) return '';
            const eq = x.indexOf('=');
            return eq == -1 ? '' : decodeURIComponent(x.substr(eq + 1));
        });

        for (const value of values) {
            if (value.startsWith('http:') || value.startsWith('https:')) {
                return tryParseURL(value);
            }
        }
        const newurl = tryParseURL(url.href.substring(url.href.indexOf('http', 1)));
        if (newurl) return newurl;
    }
    return null;
}

function getIdentifierFromURLImpl(url: URL): string {
    if (!url) return null;

    // nested urls
    const nested = tryUnwrapNestedURL(url);
    if (nested) {
        return getIdentifierFromURLImpl(nested);
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

    const pathArray = url.pathname.split('/');

    if (domainIs(host, 'facebook.com')) {
        if (searchParams.get('story_fbid')) return null;
        const fbId = searchParams.get('id');
        const p = url.pathname.replace('/pg/', '/');
        const isGroup = p.startsWith('/groups/');
        if (isGroup && p.includes('/user/')) return 'facebook.com/' + pathArray[4]; // fb.com/groups/.../user/...
        return 'facebook.com/' + (fbId || getPartialPath(p, isGroup ? 2 : 1).substring(1));
    } else if (domainIs(host, 'reddit.com')) {
        const pathname = url.pathname.replace('/u/', '/user/');
        if (!pathname.startsWith('/user/') && !pathname.startsWith('/r/')) return null;
        if (pathname.includes('/comments/') && hostname == 'reddit.com') return null;
        return 'reddit.com' + getPartialPath(pathname, 2);
    } else if (domainIs(host, 'twitter.com')) {
        return 'twitter.com' + getPartialPath(url.pathname, 1);
    } else if (domainIs(host, 'youtube.com')) {
        const pathname = url.pathname;
        if (pathname.startsWith('/user/') || pathname.startsWith('/c/') || pathname.startsWith('/channel/'))
            return 'youtube.com' + getPartialPath(pathname, 2);
        return 'youtube.com' + getPartialPath(pathname, 1);
    } else if (domainIs(host, 'disqus.com') && url.pathname.startsWith('/by/')) {
        return 'disqus.com' + getPartialPath(url.pathname, 2);
    } else if (domainIs(host, 'medium.com')) {
        const hostParts = host.split('.');
        if (hostParts.length == 3 && hostParts[0] != 'www') {
            return host;
        }
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
        const pathname = url.pathname;
        if (url.hash) return null;
        if (pathname == '/w/index.php' && searchParams.get('action') == 'edit') {
            const title = searchParams.get('title');
            if (title && title.startsWith('User:')) {
                return 'wikipedia.org/wiki/' + title;
            }
        }
        if (pathname.startsWith('/wiki/Special:Contributions/') && url.href == window.location.href)
            return 'wikipedia.org/wiki/User:' + pathArray[3];
        if (pathname.startsWith('/wiki/User:'))
            return 'wikipedia.org/wiki/User:' + pathArray[2].split(':')[1];
        if (pathname.includes(':')) return null;
        if (pathname.startsWith('/wiki/')) return 'wikipedia.org' + decodeURIComponent(getPartialPath(pathname, 2));
        else return null;
    } else if (host.indexOf('.blogspot.') != -1) {
        const m = captureRegex(host, /([a-zA-Z0-9\-]*)\.blogspot/);
        if (m) return m + '.blogspot.com';
        else return null;
    } else if (host.includes('google.')) {
        if (url.pathname == '/search' && searchParams.get('stick') && !searchParams.get('tbm') && !searchParams.get('start')) {
            const q = searchParams.get('q');
            if (q) return 'wikipedia.org/wiki/' + q.replace(/\s/g, '_');
        }
        return null;
    } else {
        if (host.startsWith('m.')) host = host.substr(2);
        return host;
    }
}


init();

var lastGeneratedLinkId = 0;

function getMatchingAncestor(node: HTMLElement, match: (node: HTMLElement) => boolean) {
    while (node) {
        if (match(node)) return node;
        node = node.parentElement;
    }
    return node;
}

function getMatchingAncestorByCss(node: HTMLElement, cssMatch: string) {
    return getMatchingAncestor(node, x => x.matches(cssMatch));
}

function getSnippet(node: HTMLElement) : HTMLElement {
    if (hostname == 'facebook.com') {
        const pathname = window.location.pathname;
        const isPhotoPage = pathname.startsWith('/photo') || pathname.includes('/photos/') || pathname.startsWith('/video') || pathname.includes('/videos/');
        if (isPhotoPage) { 
            const sidebar = document.querySelector('[role=complementary]');
            if (sidebar) return sidebar.parentElement;
        }
        const isSearchPage = pathname.startsWith('/search/');
        return getMatchingAncestor(node, x => {
            if (x.getAttribute('role') == 'article' && (isSearchPage || x.getAttribute('aria-labelledby'))) return true;
            var dataset = x.dataset;
            if (!dataset) return false;
            if (dataset.ftr) return true;
            if (dataset.highlightTokens) return true;
            if (dataset.gt && dataset.vistracking) return true;
            return false;
        });
    }
    if (hostname == 'reddit.com')
        return getMatchingAncestorByCss(node, '.scrollerItem, .thing, .Comment');
    if (hostname == 'twitter.com')
        return getMatchingAncestorByCss(node, '.stream-item, .permalink-tweet-container, article');
    if (hostname == 'disqus.com')
        return getMatchingAncestorByCss(node, '.post-content');
    if (hostname == 'medium.com')
        return getMatchingAncestorByCss(node, '.streamItem, .streamItemConversationItem');
    if (hostname == 'youtube.com')
        return getMatchingAncestorByCss(node, 'ytd-comment-renderer, ytd-video-secondary-info-renderer');
    if (hostname == 'tumblr.com')
        return getMatchingAncestor(node, x => (x.dataset && !!(x.dataset.postId || x.dataset.id)) || x.classList.contains('post'));

    return null;
}

function getBadIdentifierReason(identifier: string, url: string, target: HTMLElement) {
    identifier = identifier || '';
    url = url || '';
    if (url) {
        const nested = tryUnwrapNestedURL(tryParseURL(url));
        if (nested) url = nested.href;
    }

    if (identifier == 't.co') return 'Shortened link. Please follow the link and then mark the resulting page.';
    if (
        identifier.startsWith('reddit.com/user/') ||
        identifier == 'twitter.com/threadreaderapp' ||
        identifier == 'twitter.com/threader_app') return 'This is user is a bot.';
    if (identifier == 'twitter.com/hashtag') return 'Hashtags cannot be labeled, only users.';
    if (url.includes('youtube.com/watch')) return 'Only channels can be labeled, not specific videos.';
    if (url.includes('reddit.com/') && url.includes('/comments/')) return 'Only users and subreddits can be labeled, not specific posts.';
    if (url.includes('facebook.com') && (
        url.includes('/posts/') ||
        url.includes('/photo/') ||
        url.includes('/photo.php') ||
        url.includes('/permalink.php') ||
        url.includes('/permalink/') ||
        url.includes('/photos/'))) return 'Only pages, users and groups can be labeled, not specific posts or photos.';
    if (url.includes('wiki') && url.includes('#')) return 'Wiki paragraphs cannot be labeled, only whole articles.';
    return null;
}

var previousConfirmationMessage: HTMLElement = null;

function displayConfirmation(identifier: string, label: LabelKind, badIdentifierReason: BadIdentifierReason, url: string, target: HTMLElement) {
    if (previousConfirmationMessage) {
        previousConfirmationMessage.remove();
        previousConfirmationMessage = null;
    }
    if (!label) return;
    if (isSocialNetwork && label != 'bad-identifier') return;

    const confirmation = document.createElement('div');
    const background =
        label == 't-friendly' ? '#eaffcf' :
            label == 'transphobic' ? '#f5d7d7' :
                '#eeeeee';
    confirmation.style.cssText = `transition: opacity 7s ease-in-out !important; opacity: 1; position: fixed; padding: 30px 15px; z-index: 99999999; white-space: pre-wrap; top: 200px; left: 30%; right: 30%; background: ${background}; color: black; font-weight: bold; font-family: Arial; box-shadow: 0px 5px 10px #ddd; border: 1px solid #ccc; font-size: 11pt;`;
    let text: string;

    if (label == 'bad-identifier') {
        const displayReason = getBadIdentifierReason(identifier, url, target);
        if (displayReason) text = displayReason;
        else if (badIdentifierReason == 'SN') text = 'This social network is not supported: ' + identifier + '.';
        else if (badIdentifierReason == 'AR') text = 'This is an archival link, it cannot be labeled: ' + identifier;
        else text = `This item could not be labeled. Possible reasons:
 • It doesn't represent a specific user or page
 • It's not a kind of object supported by Shinigami Eyes

 ${identifier || url}
`;
    } else {
        text = identifier + (
            label == 't-friendly' ? ' will be displayed as trans-friendly on search engines and social networks.' :
                label == 'transphobic' ? ' will be displayed as anti-trans on search engines and social networks.' :
                    ' has been cleared.'
        );
    }
    confirmation.textContent = text;
    document.body.appendChild(confirmation);
    previousConfirmationMessage = confirmation;
    confirmation.addEventListener('mousedown', () => confirmation.remove());
    setTimeout(() => {
        confirmation.style.opacity = '0';
    }, 2000);

    setTimeout(() => {
        confirmation.remove();
    }, 9000);
}

browser.runtime.onMessage.addListener<ShinigamiEyesMessage, ShinigamiEyesSubmission>((message, sender, sendResponse) => {

    if (message.updateAllLabels || message.confirmSetLabel) {
        displayConfirmation(message.confirmSetIdentifier, message.confirmSetLabel, message.badIdentifierReason, message.confirmSetUrl, null);
        updateAllLabels(true);
        return;
    }

    message.contextPage = window.location.href;
    const originalTarget = lastRightClickedElement;
    let target = originalTarget; // message.elementId ? browser.menus.getTargetElement(message.elementId) : null;

    while (target) {
        if (target instanceof HTMLAnchorElement) break;
        target = target.parentElement;
    }

    if (target && (<HTMLAnchorElement>target).href != message.url) target = null;

    var identifier = target ? getIdentifier(<HTMLAnchorElement>target, originalTarget) : getIdentifier(message.url);
    if (!identifier) {
        displayConfirmation(null, 'bad-identifier', null, message.url, target);
        return;
    }

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
    message.isSocialNetwork = isSocialNetwork;
    sendResponse(message);
})