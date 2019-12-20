declare class BloomFilter {
    constructor(data: Uint32Array, k: number);
    test(key: string): boolean;
    name: LabelKind;
}
interface HTMLElement {
    assignedCssLabel?: string
}

type HTMLMarkableElement = HTMLAnchorElement | HTMLSpanElement

interface LabelToSolve {
    element: HTMLMarkableElement
    identifier: string
}
type LabelKind = 't-friendly' | 'transphobic' | 'none' | '' | 'bad-identifier';
interface ShinigamiEyesSubmission {
    mark?: LabelKind
    url?: string
    tabId?: number
    frameId?: number
    debug?: number
    identifier?: string
    secondaryIdentifier?: string
    version?: number
    submissionId?: string
    contextPage?: string
    linkId?: number
    snippet?: string
    isSocialNetwork?: boolean
}
interface ShinigamiEyesCommand {
    acceptClicked?: boolean
    myself?: string
    ids?: string[]
    updateAllLabels?: boolean
    closeCallingTab?: boolean
    setTheme?: string
    confirmSetIdentifier?: string
    confirmSetLabel?: LabelKind
    confirmSetUrl?: string
    badIdentifierReason?: BadIdentifierReason
}
type LabelMap = { [identifier: string]: LabelKind };

interface ShinigamiEyesMessage extends ShinigamiEyesSubmission, ShinigamiEyesCommand {
}

type ContextMenuCommand = 'mark-t-friendly' | 'mark-transphobic' | 'mark-none' | 'help' | 'options';
type BadIdentifierReason = 'SN' | 'AR';