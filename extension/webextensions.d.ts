declare type Browser = {

    runtime: {
        sendMessage<TRequest, TResponse>(request: TRequest, response: (response: TResponse) => void);
        onMessage: {
            addListener(listener: (message, any, sendResponse) => void)
        }
    }

    storage: {
        local: BrowserStorage
    }
    tabs: {
        remove(id: number)
        sendMessage<TRequest, TResponse>(tabId: number, request: TRequest, options?: {
            frameId: number
        }, callback?: (response: TResponse) => void)
        create(options: {
            url: string
        })
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
            }) => void)
        }
    }
}
declare type BrowserStorage = {
    get(names: string[], callback: (obj: any) => void)
    set(obj: { [name: string]: any });
}
declare var browser: Browser;
declare var chrome: Browser;