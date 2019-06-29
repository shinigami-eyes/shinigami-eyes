declare class BloomFilter {
    constructor(data: Uint32Array, k: number);
    test(key: string): boolean;
    name: string;
}
type ContextMenuCommand = 'mark-t-friendly' | 'mark-transphobic' | 'mark-none' | 'help';
