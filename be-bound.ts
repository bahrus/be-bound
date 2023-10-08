import {BE, propDefaults, propInfo} from 'be-enhanced/BE.js';
import {BEConfig} from 'be-enhanced/types';
import {XE} from 'xtal-element/XE.js';
import {Actions, AllProps, AP, PAP, ProPAP, POA, TriggerSource, SpecificityResult, BindingRule} from './types';
import {register} from 'be-hive/register.js';
import {findRealm} from 'trans-render/lib/findRealm.js';
import {Actions as BPActions} from 'be-propagating/types';
import {getSignalVal} from 'be-linked/getSignalVal.js';
import {setSignalVal} from 'be-linked/setSignalVal.js';
import {SignalRefType} from 'be-linked/types';
import {BVAAllProps} from 'be-value-added/types';

export class BeBound extends BE<AP, Actions> implements Actions{
    #abortControllers: Array<AbortController>  = [];
    detach(detachedElement: Element): void {
        for(const ac of this.#abortControllers){
            ac.abort();
        }
    }
    static override get beConfig(){
        return {
            parse: true,
            parseAndCamelize: true,
            isParsedProp: 'isParsed'
        } as BEConfig;
    }

    async noAttrs(self: this): ProPAP {
        const {enhancedElement} = self;
        const defltLocal = getDfltLocal(self);
        self.bindingRules = [{
            ...defltLocal,
            remoteType: '/',
            remoteProp: enhancedElement.getAttribute('itemprop') || (enhancedElement as any).name || enhancedElement.id,
        }];
        return {
            //resolved: true,
        };
    }

    //TODO:  abort signals, clean up
    async hydrate(self: this){
        const {bindingRules, enhancedElement} = self;
        const {localName} = enhancedElement;

        for(const bindingRule of bindingRules!){
            const {localEvent, remoteType, remoteProp} = bindingRule;
            if(localEvent !== undefined){
                bindingRule.localSignal = new WeakRef(enhancedElement);
                const ab = new AbortController();
                this.#abortControllers.push(ab);
                enhancedElement.addEventListener(localEvent, async e => {
                    if(this.resolved){
                        evalBindRules(self, 'local');
                    }else{
                        await this.whenResolved();
                        evalBindRules(self, 'local');
                    }
                    
                }, {signal: ab.signal});
            }else{
                const {localProp} = bindingRule;
                switch(localName){
                    case 'meta':{
                        const {doVA} = await import('./doVA.js');
                        await doVA(self, enhancedElement, bindingRule, this.#abortControllers, evalBindRules, 'local');
                        break;
                    }
                    case 'form':{
                        bindingRule.localSignal = new WeakRef((<any>enhancedElement)[localProp!]);
                        const ab = new AbortController();
                        this.#abortControllers.push(ab);
                        enhancedElement.addEventListener('input', async e => {
                            const {target}  = e; 
                            if(target instanceof HTMLElement){
                                if(target.getAttribute('name') === localProp){
                                    if(this.resolved){
                                        evalBindRules(self, 'local')
                                    }else{
                                        await this.whenResolved();
                                        evalBindRules(self, 'local');
                                    }
                                    
                                }
                            }
                        }, {signal: ab.signal});
                        break;
                    }
                    default:
                        import('be-propagating/be-propagating.js');
                        const bePropagating = await (<any>enhancedElement).beEnhanced.whenResolved('be-propagating') as BPActions;
                        const signal = await bePropagating.getSignal(localProp!);
                        bindingRule.localSignal = new WeakRef(signal);
                        const ab = new AbortController();
                        this.#abortControllers.push(ab);
                        signal.addEventListener('value-changed', e => {
                            evalBindRules(self, 'local');
                        }, {signal: ab.signal});
                }
            }
            //similar code as be-pute/be-switched -- share somehow?
            switch(remoteType){
                case '/':{
                    const host = await findRealm(enhancedElement, 'hostish');
                    if(!host) throw 404;
                    import('be-propagating/be-propagating.js');
                    const bePropagating = await (<any>host).beEnhanced.whenResolved('be-propagating') as BPActions;
                    const signal = await bePropagating.getSignal(remoteProp!);
                    bindingRule.remoteSignal = new WeakRef(signal);
                    const ab = new AbortController();
                    this.#abortControllers.push(ab);
                    signal.addEventListener('value-changed', e => {
                        evalBindRules(self, 'remote');
                    }, {signal: ab.signal});
                    break;
                }
                case '@':{
                    const inputEl = await findRealm(enhancedElement, ['wf', remoteProp!]) as HTMLInputElement;
                    if(!inputEl) throw 404;
                    bindingRule.remoteSignal = new WeakRef(inputEl);
                    const ab = new AbortController();
                    this.#abortControllers.push(ab);
                    inputEl.addEventListener('input', e => {
                        evalBindRules(self, 'remote');
                    }, {signal: ab.signal});
                    break;
                }
                case '$': {
                    const itempropEl = await findRealm(enhancedElement, ['wis', remoteProp!]) as Element;
                    if(itempropEl.hasAttribute('contenteditable')){
                        bindingRule.remoteSignal = new WeakRef(itempropEl);
                        const ab = new AbortController();
                        this.#abortControllers.push(ab);
                        itempropEl.addEventListener('input', e => {
                            evalBindRules(self, 'remote');
                        }, {signal: ab.signal})
                    }else{
                        const {doVA} = await import('./doVA.js');
                        await doVA(self, itempropEl, bindingRule, this.#abortControllers, evalBindRules, 'remote')
                        
                    }
                    break;
                }
                case '#': {
                    const inputEl = await findRealm(enhancedElement, ['wrn', '#' + remoteProp]) as Element;
                    if(!inputEl) throw 404;
                    bindingRule.remoteSignal = new WeakRef(inputEl);
                    const ab = new AbortController();
                    this.#abortControllers.push(ab);
                    inputEl.addEventListener('input', e => {
                        evalBindRules(self, 'remote');
                    }, {signal: ab.signal});
                    break;
                }
                case '-': {
                    const customElement = await findRealm(enhancedElement, ['us', `[-${remoteProp}]`]);
                    const {lispToCamel} = await import('trans-render/lib/lispToCamel.js');
                    const newRemoteProp = lispToCamel(remoteProp!);
                    bindingRule.remoteProp = newRemoteProp;
                    if(!customElement) throw 404;
                    import('be-propagating/be-propagating.js');
                    const bePropagating = await (<any>customElement).beEnhanced.whenResolved('be-propagating') as BPActions;
                    const signal = await bePropagating.getSignal(newRemoteProp!);
                    bindingRule.remoteSignal = new WeakRef(signal);
                    const ab = new AbortController();
                    this.#abortControllers.push(ab);
                    signal.addEventListener('value-changed', e => {
                        evalBindRules(self, 'remote');
                    }, {signal: ab.signal});
                    break;
                }
                default:{
                    throw 'NI'
                }
                    
            }
        }
        //if(localName === 'meta') console.log('eval tie');
        evalBindRules(self, 'tie');
        //if(localName === 'meta') console.log('resolve');
        return {
            resolved: true,
        }
    }

    async onCamelized(self: this): ProPAP {
        const {With, Between, with: w, between} = self;
        let withBindingRules: Array<BindingRule> = [];
        let betweenBindingRules: Array<BindingRule> = [];
        if(With !== undefined || w !== undefined){
            const {prsWith} = await import('./prsWith.js');
            withBindingRules = prsWith(self);
        }
        if(Between !== undefined || between !== undefined){
            const {prsBetween} = await import('./prsBetween.js');
            betweenBindingRules = prsBetween(self);
        }
        const dflt = getDfltLocal(self);
        return {
            bindingRules: [
                ...withBindingRules.map(x => ({...dflt, ...x})), 
                ...betweenBindingRules.map(x => ({...dflt, ...x}))
            ],
        };
    }


}

const typeComp: Map<string, TriggerSource> = new Map([
    ['string.undefined', 'local'],
    ['string.string', 'tie'],
    ['boolean.undefined', 'local'],
]);

export const strType = String.raw `\$|\#|\@|\/|\-`;

export function getDfltLocal(self: AP){
    const {enhancedElement} = self;
    const {localName} = enhancedElement;
    let localProp: string | null = 'textContent';
    switch(localName){
        case 'input':
            const {type} = enhancedElement as HTMLInputElement;
            switch(type){
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
    } as BindingRule;
}

function compareSpecificity(localVal: any, remoteVal: any) : SpecificityResult  {
    if(localVal === remoteVal) return {
        winner: 'tie',
        val: localVal
    };
    const localType = typeof localVal;
    const remoteType = typeof remoteVal;
    const sameType = localType === remoteType;
    let winner = typeComp.get(`${localType}.${remoteType}`)!;
    let val = localVal;
    if(winner === 'tie'){
        switch(localType){
            case 'string':
                if(localVal.length > remoteVal.length){
                    winner = 'local';
                    val = localVal;
                }else{
                    winner = 'remote';
                    val = remoteVal;
                }
        }
    }else{

    }
    return {
        winner,
        val
    };

}


function evalBindRules(self: BeBound, src: TriggerSource){
    //console.log('evalBindRules', src);
    const {bindingRules} = self;
    for(const bindingRule of bindingRules!){
        const {localProp, remoteProp, localSignal, remoteSignal} = bindingRule;
        const localSignalDeref = localSignal?.deref() as any;
        const remoteSignalDeref = remoteSignal?.deref() as any;
        if(localSignalDeref === undefined) throw 404;
        if(remoteSignalDeref === undefined) throw 404;
        const localVal = getSignalVal(localSignalDeref);
        const remoteVal = getSignalVal(remoteSignalDeref);
        if(localVal === remoteVal) continue; //TODO:  what if they are objects?
        let winner = src;
        let tieBrakerVal: any = undefined;
        if(winner === 'tie'){
            const tieBreaker = compareSpecificity(localVal, remoteVal);
            winner = tieBreaker.winner!;
            //console.log({winner, tieBreaker, localProp, remoteProp, localVal, remoteVal});
            if(winner === 'tie') continue;
            tieBrakerVal = tieBreaker.val;
            
        }
        
        switch(winner){
            case 'local':
                setSignalVal(remoteSignalDeref, tieBrakerVal || localVal);
                break;
            case 'remote':
                setSignalVal(localSignalDeref, tieBrakerVal || remoteVal);
                break;
        }
    }
}

export interface BeBound extends AllProps{}

const tagName = 'be-bound';
const ifWantsToBe = 'bound';
const upgrade = '*';

const xe = new XE<AP, Actions>({
    config:{
        tagName,
        isEnh: true,
        propDefaults: {
            ...propDefaults,
        },
        propInfo: {
            ...propInfo
        },
        actions:{
            noAttrs: {
                ifAllOf: ['isParsed'],
                ifNoneOf: ['With', 'Between', 'with', 'between']
            },
            onCamelized:{
                ifAllOf: ['isParsed'],
                ifAtLeastOneOf: ['With', 'Between', 'with', 'between'],
            },
            hydrate: 'bindingRules'
        }
    },
    superclass: BeBound
});

register(ifWantsToBe, upgrade, tagName);