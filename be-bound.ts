import {BE, propDefaults, propInfo} from 'be-enhanced/BE.js';
import {BEConfig} from 'be-enhanced/types';
import {XE} from 'xtal-element/XE.js';
import {Actions, AllProps, AP, PAP, ProPAP, POA, TriggerSource, SpecificityResult, BindingRule} from './types';
import {register} from 'be-hive/register.js';
import {findRealm} from 'trans-render/lib/findRealm.js';
import {getRemoteEl} from 'be-linked/getRemoteEl.js';
import {Actions as BPActions} from 'be-propagating/types';
import {getSignalVal} from 'be-linked/getSignalVal.js';
import {setSignalVal} from 'be-linked/setSignalVal.js';
import {SignalContainer} from 'be-linked/types';


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
                        const {doVA} = await import('be-linked/doVA.js');
                        await doVA(self, enhancedElement, bindingRule as SignalContainer, 'localSignal', this.#abortControllers, evalBindRules as any, 'local');
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
                        const {doPG} = await import('be-linked/doPG.js');
                        await doPG(self, enhancedElement, bindingRule as SignalContainer, 'localSignal', localProp!, this.#abortControllers, evalBindRules as any, 'local');
                }
            }
            //similar code as be-pute/be-switched -- share somehow?
            const el = await getRemoteEl(enhancedElement, remoteType!, remoteProp!);
            const stInput = () => {
                bindingRule.remoteSignal = new WeakRef(el);
                const ab = new AbortController();
                this.#abortControllers.push(ab);
                el.addEventListener('input', e => {
                    evalBindRules(self, 'remote');
                }, {signal: ab.signal});
            }
            switch(remoteType){
                case '/':{
                    const {doPG} = await import('be-linked/doPG.js');
                    await doPG(self, el, bindingRule as SignalContainer, 'remoteSignal', remoteProp!, this.#abortControllers, evalBindRules as any, 'remote');
                    break;
                }
                case '@':{
                    stInput();
                    break;
                }
                case '$': {
                    if(el.hasAttribute('contenteditable')){
                        stInput();
                    }else{
                        const {doVA} = await import('be-linked/doVA.js');
                        await doVA(self, el, bindingRule as SignalContainer, 'remoteSignal', this.#abortControllers, evalBindRules as any, 'remote');
                        
                    }
                    break;
                }
                case '#': {
                    stInput();
                    break;
                }
                case '-': {
                    const {lispToCamel} = await import('trans-render/lib/lispToCamel.js');
                    const newRemoteProp = lispToCamel(remoteProp!);
                    bindingRule.remoteProp = newRemoteProp;
                    import('be-propagating/be-propagating.js');
                    const bePropagating = await (<any>el).beEnhanced.whenResolved('be-propagating') as BPActions;
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
        await evalBindRules(self, 'tie');
        //if(localName === 'meta') console.log('resolve');
        return {
            resolved: true,
        }
    }

    async onCamelized(self: this): ProPAP {
        const {With, Between, with: w, between} = self;
        let withBindingRules: Array<BindingRule> = [];
        let betweenBindingRules: Array<BindingRule> = [];
        if((With || w ) !== undefined){
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

async function compareSpecificity(localVal: any, remoteVal: any) : Promise<SpecificityResult>  {
    if(localVal === remoteVal) return {
        winner: 'tie',
        val: localVal
    };
    const {breakTie} = await import('./breakTie.js');
    return breakTie(localVal, remoteVal);
}


async function evalBindRules(self: BeBound, src: TriggerSource){
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
            const tieBreaker = await compareSpecificity(localVal, remoteVal);
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