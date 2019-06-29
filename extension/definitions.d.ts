declare class BloomFilter {
    constructor(data: Uint32Array, k: number);
    test(key: string): boolean;
    name: string;
}
type LabelKind = 't-friendly' | 'transphobic' | 'none' | '';
type ShinigamiSubmission = {
    mark: LabelKind
    url: string
    tabId: number
    frameId: number
    debug: number
    identifier?: string
    secondaryIdentifier?: string
}
type ContextMenuCommand = 'mark-t-friendly' | 'mark-transphobic' | 'mark-none' | 'help';
