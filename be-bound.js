import { BE, propDefaults, propInfo } from 'be-enhanced/BE.js';
import { XE } from 'xtal-element/XE.js';
import { register } from 'be-hive/register.js';
import { findRealm } from 'trans-render/lib/findRealm.js';
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
                        throw 'NI';
                }
            }
            //similar code as be-pute/be-switched -- share somehow?
            switch (remoteType) {
                case '/':
                    const host = await findRealm(enhancedElement, 'hostish');
                    if (!host)
                        throw 404;
                    import('be-propagating/be-propagating.js');
                    //console.log('begin attaching be-propagating');
                    const bePropagating = await host.beEnhanced.whenResolved('be-propagating');
                    //console.log('end attaching be-propagating');
                    const signal = await bePropagating.getSignal(remoteProp);
                    bindingRule.remoteSignal = new WeakRef(signal);
                    //console.log('end remote hydrate');
                    signal.addEventListener('value-changed', e => {
                        evalBindRules(self, 'remote');
                    });
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
        const { With, Between } = self;
        let withBindingRules = [];
        if (With !== undefined) {
            const { prsWith } = await import('./prsWith.js');
            withBindingRules = prsWith(self);
        }
        return {
            bindingRules: [...withBindingRules]
        };
    }
}
const typeComp = new Map([
    ['string.undefined', 'local'],
    ['string.string', 'tie'],
    ['boolean.undefined', 'local'],
]);
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
//TODO:  replace be-linked with this one
export function getSignalVal(obj) {
    if (obj instanceof Element) {
        if ('checked' in obj) {
            if (obj instanceof HTMLInputElement && obj.type === 'checkbox') {
                return obj.checked;
            }
        }
        if (obj.hasAttribute('aria-checked')) {
            return obj.getAttribute('aria-checked') === 'true';
        }
        if ('value' in obj) {
            return obj.value;
        }
        //TODO:  hyperlinks
        return obj.textContent;
    }
    else {
        return obj.value;
    }
}
//TODO:  move this to be-linked.
function setSignalVal(obj, val) {
    if (obj instanceof Element) {
        const typeOfVal = typeof val;
        if ('checked' in obj && typeOfVal === 'boolean') {
            obj.checked = val;
            return;
        }
        //TODO:  aria-checked?
        // if(obj.hasAttribute('aria-checked')){
        //     return obj.setAttribute('aria-checked' === 'true';
        // }
        if ('value' in obj && typeOfVal === 'string') {
            obj.value = val;
            return;
        }
        //TODO:  hyperlinks
        obj.textContent = val.toString();
    }
    else {
        obj.value = val;
    }
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
                ifNoneOf: ['With', 'Between']
            },
            onCamelized: {
                ifAllOf: ['isParsed'],
                ifAtLeastOneOf: ['With', 'Between'],
            },
            hydrate: 'bindingRules'
        }
    },
    superclass: BeBound
});
register(ifWantsToBe, upgrade, tagName);
