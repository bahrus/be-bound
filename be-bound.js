import { BE, propDefaults, propInfo } from 'be-enhanced/BE.js';
import { XE } from 'xtal-element/XE.js';
import { register } from 'be-hive/register.js';
import { findRealm } from 'trans-render/lib/findRealm.js';
import { getSignalVal } from 'be-linked/getSignalVal.js';
import { setSignalVal } from 'be-linked/setSignalVal.js';
export class BeBound extends BE {
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
                enhancedElement.addEventListener(localEvent, async (e) => {
                    if (this.resolved) {
                        evalBindRules(self, 'local');
                    }
                    else {
                        await this.whenResolved();
                        evalBindRules(self, 'local');
                    }
                });
            }
            else {
                switch (localName) {
                    case 'meta': {
                        import('be-value-added/be-value-added.js');
                        const beValueAdded = await enhancedElement.beEnhanced.whenResolved('be-value-added');
                        bindingRule.localSignal = new WeakRef(beValueAdded);
                        beValueAdded.addEventListener('value-changed', async (e) => {
                            //console.log({resolved: this.resolved});
                            if (this.resolved) {
                                evalBindRules(self, 'local');
                            }
                            else {
                                await this.whenResolved();
                                evalBindRules(self, 'local');
                            }
                        });
                        break;
                    }
                    default:
                        const { localProp } = bindingRule;
                        import('be-propagating/be-propagating.js');
                        const bePropagating = await enhancedElement.beEnhanced.whenResolved('be-propagating');
                        const signal = await bePropagating.getSignal(localProp);
                        bindingRule.localSignal = new WeakRef(signal);
                        signal.addEventListener('value-changed', e => {
                            evalBindRules(self, 'local');
                        });
                }
            }
            //similar code as be-pute/be-switched -- share somehow?
            switch (remoteType) {
                case '/': {
                    const host = await findRealm(enhancedElement, 'hostish');
                    if (!host)
                        throw 404;
                    import('be-propagating/be-propagating.js');
                    const bePropagating = await host.beEnhanced.whenResolved('be-propagating');
                    const signal = await bePropagating.getSignal(remoteProp);
                    bindingRule.remoteSignal = new WeakRef(signal);
                    signal.addEventListener('value-changed', e => {
                        evalBindRules(self, 'remote');
                    });
                    break;
                }
                case '@': {
                    const inputEl = await findRealm(enhancedElement, ['wf', remoteProp]);
                    if (!inputEl)
                        throw 404;
                    bindingRule.remoteSignal = new WeakRef(inputEl);
                    inputEl.addEventListener('input', e => {
                        evalBindRules(self, 'remote');
                    });
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
