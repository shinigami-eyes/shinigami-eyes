declare type Browser = {

    runtime: {
        sendMessage<TRequest, TResponse>(request: TRequest, response: (response: TResponse) => void): void;
        onMessage: {
            addListener<TRequest, TResponse>(listener: (message: TRequest, sender: MessageSender, sendResponse: (response: TResponse) => void) => void): void
        }
    }

    storage: {
        local: BrowserStorage
    }
    tabs: {
        remove(id: number): void
        sendMessage<TRequest, TResponse>(tabId: number, request: TRequest, options?: {
            frameId: number
        }, callback?: (response: TResponse) => void): void
        create(options: {
            url: string
        }): void
    }
    extension: {
        getURL(relativeUrl: string): string
    }
    contextMenus: {
        create(options: {
            id: string
            title: string
            contexts: 'link'[]
            targetUrlPatterns: string[]
        }): void
        onClicked: {
            addListener(listener: (info: {
                menuItemId: string
                frameId: number
                linkUrl: string
            }, tab: {
                id: number
            }) => void): void
        }
    }
}
type MessageSender = {
    tab?: {id: number};
    frameId?: number;
    id?: string;
    url?: string;
    tlsChannelId?: string;
  };
declare type BrowserStorage = {
    get(names: string[], callback: (obj: any) => void): void
    set(obj: { [name: string]: any }): void;
}
declare var browser: Browser;
declare var chrome: Browser;