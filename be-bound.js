import { BE, propDefaults, propInfo } from 'be-enhanced/BE.js';
import { XE } from 'xtal-element/XE.js';
import { register } from 'be-hive/register.js';
import { findRealm } from 'trans-render/lib/findRealm.js';
import { getSignalVal } from 'be-linked/getSignalVal.js';
import { setSignalVal } from 'be-linked/setSignalVal.js';
export class BeBound extends BE {
    #abortControllers = [];
    detach(detachedElement) {
        for (const ac of this.#abortControllers) {
            ac.abort();
        }
    }
    static get beConfig() {
        return {
            parse: true,
            parseAndCamelize: true,
            isParsedProp: 'isParsed'
        };
    }
    async noAttrs(self) {
        const { enhancedElement } = self;
        const defltLocal = getDfltLocal(self);
        self.bindingRules = [{
                ...defltLocal,
                remoteType: '/',
                remoteProp: enhancedElement.getAttribute('itemprop') || enhancedElement.name || enhancedElement.id,
            }];
        return {
        //resolved: true,
        };
    }
    //TODO:  abort signals, clean up
    async hydrate(self) {
        const { bindingRules, enhancedElement } = self;
        const { localName } = enhancedElement;
        for (const bindingRule of bindingRules) {
            const { localEvent, remoteType, remoteProp } = bindingRule;
            if (localEvent !== undefined) {
                bindingRule.localSignal = new WeakRef(enhancedElement);
                const ab = new AbortController();
                this.#abortControllers.push(ab);
                enhancedElement.addEventListener(localEvent, async (e) => {
                    if (this.resolved) {
                        evalBindRules(self, 'local');
                    }
                    else {
                        await this.whenResolved();
                        evalBindRules(self, 'local');
                    }
                }, { signal: ab.signal });
            }
            else {
                const { localProp } = bindingRule;
                switch (localName) {
                    case 'meta': {
                        const { doVA } = await import('./doVA.js');
                        await doVA(self, enhancedElement, bindingRule, this.#abortControllers, evalBindRules, 'local');
                        break;
                    }
                    case 'form': {
                        bindingRule.localSignal = new WeakRef(enhancedElement[localProp]);
                        const ab = new AbortController();
                        this.#abortControllers.push(ab);
                        enhancedElement.addEventListener('input', async (e) => {
                            const { target } = e;
                            if (target instanceof HTMLElement) {
                                if (target.getAttribute('name') === localProp) {
                                    if (this.resolved) {
                                        evalBindRules(self, 'local');
                                    }
                                    else {
                                        await this.whenResolved();
                                        evalBindRules(self, 'local');
                                    }
                                }
                            }
                        }, { signal: ab.signal });
                        break;
                    }
                    default:
                        const { doPG } = await import('./doPG.js');
                        await doPG(self, enhancedElement, bindingRule, localProp, this.#abortControllers, evalBindRules, 'local');
                }
            }
            //similar code as be-pute/be-switched -- share somehow?
            switch (remoteType) {
                case '/': {
                    const host = await findRealm(enhancedElement, 'hostish');
                    if (!host)
                        throw 404;
                    const { doPG } = await import('./doPG.js');
                    await doPG(self, host, bindingRule, remoteProp, this.#abortControllers, evalBindRules, 'remote');
                    // import('be-propagating/be-propagating.js');
                    // const bePropagating = await (<any>host).beEnhanced.whenResolved('be-propagating') as BPActions;
                    // const signal = await bePropagating.getSignal(remoteProp!);
                    // bindingRule.remoteSignal = new WeakRef(signal);
                    // const ab = new AbortController();
                    // this.#abortControllers.push(ab);
                    // signal.addEventListener('value-changed', e => {
                    //     evalBindRules(self, 'remote');
                    // }, {signal: ab.signal});
                    break;
                }
                case '@': {
                    const inputEl = await findRealm(enhancedElement, ['wf', remoteProp]);
                    if (!inputEl)
                        throw 404;
                    bindingRule.remoteSignal = new WeakRef(inputEl);
                    const ab = new AbortController();
                    this.#abortControllers.push(ab);
                    inputEl.addEventListener('input', e => {
                        evalBindRules(self, 'remote');
                    }, { signal: ab.signal });
                    break;
                }
                case '$': {
                    const itempropEl = await findRealm(enhancedElement, ['wis', remoteProp]);
                    if (itempropEl.hasAttribute('contenteditable')) {
                        bindingRule.remoteSignal = new WeakRef(itempropEl);
                        const ab = new AbortController();
                        this.#abortControllers.push(ab);
                        itempropEl.addEventListener('input', e => {
                            evalBindRules(self, 'remote');
                        }, { signal: ab.signal });
                    }
                    else {
                        const { doVA } = await import('./doVA.js');
                        await doVA(self, itempropEl, bindingRule, this.#abortControllers, evalBindRules, 'remote');
                    }
                    break;
                }
                case '#': {
                    const inputEl = await findRealm(enhancedElement, ['wrn', '#' + remoteProp]);
                    if (!inputEl)
                        throw 404;
                    bindingRule.remoteSignal = new WeakRef(inputEl);
                    const ab = new AbortController();
                    this.#abortControllers.push(ab);
                    inputEl.addEventListener('input', e => {
                        evalBindRules(self, 'remote');
                    }, { signal: ab.signal });
                    break;
                }
                case '-': {
                    const customElement = await findRealm(enhancedElement, ['us', `[-${remoteProp}]`]);
                    const { lispToCamel } = await import('trans-render/lib/lispToCamel.js');
                    const newRemoteProp = lispToCamel(remoteProp);
                    bindingRule.remoteProp = newRemoteProp;
                    if (!customElement)
                        throw 404;
                    import('be-propagating/be-propagating.js');
                    const bePropagating = await customElement.beEnhanced.whenResolved('be-propagating');
                    const signal = await bePropagating.getSignal(newRemoteProp);
                    bindingRule.remoteSignal = new WeakRef(signal);
                    const ab = new AbortController();
                    this.#abortControllers.push(ab);
                    signal.addEventListener('value-changed', e => {
                        evalBindRules(self, 'remote');
                    }, { signal: ab.signal });
                    break;
                }
                default: {
                    throw 'NI';
                }
            }
        }
        //if(localName === 'meta') console.log('eval tie');
        evalBindRules(self, 'tie');
        //if(localName === 'meta') console.log('resolve');
        return {
            resolved: true,
        };
    }
    async onCamelized(self) {
        const { With, Between, with: w, between } = self;
        let withBindingRules = [];
        let betweenBindingRules = [];
        if (With !== undefined || w !== undefined) {
            const { prsWith } = await import('./prsWith.js');
            withBindingRules = prsWith(self);
        }
        if (Between !== undefined || between !== undefined) {
            const { prsBetween } = await import('./prsBetween.js');
            betweenBindingRules = prsBetween(self);
        }
        const dflt = getDfltLocal(self);
        return {
            bindingRules: [
                ...withBindingRules.map(x => ({ ...dflt, ...x })),
                ...betweenBindingRules.map(x => ({ ...dflt, ...x }))
            ],
        };
    }
}
const typeComp = new Map([
    ['string.undefined', 'local'],
    ['string.string', 'tie'],
    ['boolean.undefined', 'local'],
]);
export const strType = String.raw `\$|\#|\@|\/|\-`;
export function getDfltLocal(self) {
    const { enhancedElement } = self;
    const { localName } = enhancedElement;
    let localProp = 'textContent';
    switch (localName) {
        case 'input':
            const { type } = enhancedElement;
            switch (type) {
                case 'number':
                    localProp = 'valueAsNumber';
                    break;
                case 'checkbox':
                    localProp = 'checked';
                    break;
                default:
                    localProp = 'value';
            }
            break;
        case 'meta':
            localProp = 'value';
        // default:
        //     localProp = enhancedElement.getAttribute('itemprop');
        //     if(localProp === null) throw 'itemprop not specified';
    }
    return {
        localEvent: localName === 'input' || enhancedElement.hasAttribute('contenteditable') ? 'input' : undefined,
        localProp,
    };
}
function compareSpecificity(localVal, remoteVal) {
    if (localVal === remoteVal)
        return {
            winner: 'tie',
            val: localVal
        };
    const localType = typeof localVal;
    const remoteType = typeof remoteVal;
    const sameType = localType === remoteType;
    let winner = typeComp.get(`${localType}.${remoteType}`);
    let val = localVal;
    if (winner === 'tie') {
        switch (localType) {
            case 'string':
                if (localVal.length > remoteVal.length) {
                    winner = 'local';
                    val = localVal;
                }
                else {
                    winner = 'remote';
                    val = remoteVal;
                }
        }
    }
    else {
    }
    return {
        winner,
        val
    };
}
function evalBindRules(self, src) {
    //console.log('evalBindRules', src);
    const { bindingRules } = self;
    for (const bindingRule of bindingRules) {
        const { localProp, remoteProp, localSignal, remoteSignal } = bindingRule;
        const localSignalDeref = localSignal?.deref();
        const remoteSignalDeref = remoteSignal?.deref();
        if (localSignalDeref === undefined)
            throw 404;
        if (remoteSignalDeref === undefined)
            throw 404;
        const localVal = getSignalVal(localSignalDeref);
        const remoteVal = getSignalVal(remoteSignalDeref);
        if (localVal === remoteVal)
            continue; //TODO:  what if they are objects?
        let winner = src;
        let tieBrakerVal = undefined;
        if (winner === 'tie') {
            const tieBreaker = compareSpecificity(localVal, remoteVal);
            winner = tieBreaker.winner;
            //console.log({winner, tieBreaker, localProp, remoteProp, localVal, remoteVal});
            if (winner === 'tie')
                continue;
            tieBrakerVal = tieBreaker.val;
        }
        switch (winner) {
            case 'local':
                setSignalVal(remoteSignalDeref, tieBrakerVal || localVal);
                break;
            case 'remote':
                setSignalVal(localSignalDeref, tieBrakerVal || remoteVal);
                break;
        }
    }
}
const tagName = 'be-bound';
const ifWantsToBe = 'bound';
const upgrade = '*';
const xe = new XE({
    config: {
        tagName,
        isEnh: true,
        propDefaults: {
            ...propDefaults,
        },
        propInfo: {
            ...propInfo
        },
        actions: {
            noAttrs: {
                ifAllOf: ['isParsed'],
                ifNoneOf: ['With', 'Between', 'with', 'between']
            },
            onCamelized: {
                ifAllOf: ['isParsed'],
                ifAtLeastOneOf: ['With', 'Between', 'with', 'between'],
            },
            hydrate: 'bindingRules'
        }
    },
    superclass: BeBound
});
register(ifWantsToBe, upgrade, tagName);
