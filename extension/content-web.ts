var { shinigamiEyesFindTwitterNumericIds } = (function () {

    class Queue<T> {
        pending: T[] = [];
        processed: Set<T> = new Set();
        public constructor() { }
        public enqueue(item: T) {
            if (this.processed.has(item)) return;
            this.processed.add(item);
            this.pending.push(item);
        }
        public dequeue(): T {
            if (!this.pending.length) return null;
            return this.pending.shift();
        }
        public has(key: T) {
            return this.processed.has(key);
        }
    }



    type ReactObject = any;

    class NodeQueue extends Queue<Node> { }
    class ReactObjectQueue extends Queue<ReactObject> { }

    function exploreNodeAndNeighborhood(root: Node, wantIdForScreenName: string) {
        const nodeQueue = new NodeQueue();
        const reactQueue = new ReactObjectQueue();
        const mappings: TwitterMapping[] = [];
        const deadline = Date.now() + 150;
        while (root) {
            if (exploreNodeAndDescendants(root, nodeQueue, reactQueue, wantIdForScreenName, mappings, deadline)) break;
            root = root.parentNode;
        }
        return { nodeQueue, reactQueue, mappings };
    }


    function exploreNodeAndDescendants(root: Node, nodeQueue: NodeQueue, reactQueue: ReactObjectQueue, wantIdForScreenName: string, destination: TwitterMapping[], deadline: number) {
        nodeQueue.enqueue(root);
        let node: Node;
        while (node = nodeQueue.dequeue()) {
            for (const name of Object.getOwnPropertyNames(node).filter(x => x.startsWith('__reactProps'))) {
                const value = (<any>node)[name];
                if (exploreReactObjectTree(value, reactQueue, wantIdForScreenName, destination, deadline)) return true;
            }

            for (let child = node.firstChild; child; child = child.nextSibling) {
                nodeQueue.enqueue(child);
            }
        }
        return false;
    }


    function exploreReactObjectTree(root: ReactObject, queue: ReactObjectQueue, wantIdForScreenName: string, destination: TwitterMapping[], deadline: number) {
        queue.enqueue(root);

        let obj: ReactObject;
        while (obj = queue.dequeue()) {
            let userName: string = null;
            try {
                userName = <string>obj.screen_name;
            } catch (e) {
            }
            if (userName) {
                let numericId: string = null;
                try {
                    numericId = <string>obj.id_str;
                } catch (e) {
                }
                if (numericId) {
                    destination.push({ userName: userName, numericId: numericId });
                    if (wantIdForScreenName && userName.toLowerCase() == wantIdForScreenName.toLowerCase()) return true;
                    continue;
                }
            }

            let props;
            try {
                props = Object.getOwnPropertyNames(obj);
            } catch (e) {
                continue;
            }
            for (const name of props) {
                if (name == '_owner') continue;

                let val = null;
                try {
                    val = obj[name]
                } catch {
                }
                if (!val) continue;
                if (typeof val != 'object') {
                    continue;
                }
                if (val instanceof Node || val instanceof Window) continue;
                queue.enqueue(val);
            }

            if (queue.processed.size >= 1000 || Date.now() > deadline) {
                //console.log('Reached limit.')
                return true;
            }
        }
        return false;
    }

    function shinigamiEyesFindTwitterNumericIds(request: ShinigamiEyesFindTwitterNumericIdsRequest, isFirefox: boolean): ShinigamiEyesFindTwitterNumericIdsResponse {
        const link = <HTMLAnchorElement>document.querySelector("[shinigami-eyes-link-id='" + request.linkId + "']");

        let article: Node = link ? (link.closest('article') ?? link) : document.body;
        //console.log('Starting exploration from: ');
        //console.log(article);
        if (isFirefox)
            article = <Node>(<any>article).wrappedJSObject;
        const result = exploreNodeAndNeighborhood(article, request.wantIdForScreenName);

        //console.log('Explored nodes: ' + result.nodeQueue.processed.size + ', explored objects: ' + result.reactQueue.processed.size);
        return { mappings: result.mappings };
    }

    return { shinigamiEyesFindTwitterNumericIds };

})();


interface ShinigamiEyesFindTwitterNumericIdsRequest {
    linkId: number;
    wantIdForScreenName: string;
    requestId?: string;
}
interface ShinigamiEyesFindTwitterNumericIdsResponse {
    mappings: TwitterMapping[];
    requestId?: string;
}

window.addEventListener(
    "message",
    (event) => {
        if (event.origin !== 'https://x.com' && event.origin !== 'https://twitter.com') return;
        const request = <ShinigamiEyesFindTwitterNumericIdsRequest>event.data?.shinigamiEyesFindTwitterNumericIdsRequest;
        if (request) {
            let result: ShinigamiEyesFindTwitterNumericIdsResponse = null;
            try {
                result = shinigamiEyesFindTwitterNumericIds(request, false);
            } catch (e) {
                console.warn(e);
            }
            result ??= <any>{};
            result.requestId = request.requestId;
            window.postMessage({
                shinigamiEyesFindTwitterNumericIdsResponse: result
            });

        }

    },
    false,
);
