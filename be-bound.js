import { BE, propDefaults, propInfo } from 'be-enhanced/BE.js';
import { XE } from 'xtal-element/XE.js';
import { register } from 'be-hive/register.js';
import { getRemoteEl } from 'be-linked/getRemoteEl.js';
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
                        const { doVA } = await import('be-linked/doVA.js');
                        await doVA(self, enhancedElement, bindingRule, 'localSignal', this.#abortControllers, evalBindRules, 'local');
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
                        const { doPG } = await import('be-linked/doPG.js');
                        await doPG(self, enhancedElement, bindingRule, 'localSignal', localProp, this.#abortControllers, evalBindRules, 'local');
                }
            }
            //similar code as be-pute/be-switched -- share somehow?
            const el = await getRemoteEl(enhancedElement, remoteType, remoteProp);
            const stInput = () => {
                bindingRule.remoteSignal = new WeakRef(el);
                const ab = new AbortController();
                this.#abortControllers.push(ab);
                el.addEventListener('input', e => {
                    evalBindRules(self, 'remote');
                }, { signal: ab.signal });
            };
            switch (remoteType) {
                case '/': {
                    const { doPG } = await import('be-linked/doPG.js');
                    await doPG(self, el, bindingRule, 'remoteSignal', remoteProp, this.#abortControllers, evalBindRules, 'remote');
                    break;
                }
                case '@': {
                    stInput();
                    break;
                }
                case '$': {
                    if (el.hasAttribute('contenteditable')) {
                        stInput();
                    }
                    else {
                        const { doVA } = await import('be-linked/doVA.js');
                        await doVA(self, el, bindingRule, 'remoteSignal', this.#abortControllers, evalBindRules, 'remote');
                    }
                    break;
                }
                case '#': {
                    stInput();
                    break;
                }
                case '-': {
                    const { lispToCamel } = await import('trans-render/lib/lispToCamel.js');
                    const newRemoteProp = lispToCamel(remoteProp);
                    bindingRule.remoteProp = newRemoteProp;
                    import('be-propagating/be-propagating.js');
                    const bePropagating = await el.beEnhanced.whenResolved('be-propagating');
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
        if ((With || w) !== undefined) {
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
