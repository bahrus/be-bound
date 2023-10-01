import {BE, propDefaults, propInfo} from 'be-enhanced/BE.js';
import {BEConfig} from 'be-enhanced/types';
import {XE} from 'xtal-element/XE.js';
import {Actions, AllProps, AP, PAP, ProPAP, POA, TriggerSource, SpecificityResult, BindingRule} from './types';
import {register} from 'be-hive/register.js';
import {findRealm} from 'trans-render/lib/findRealm.js';
import {Actions as BPActions} from 'be-propagating/types';
//import {getSignalVal} from 'be-linked/getSignalVal.js'
import {SignalRefType} from 'be-linked/types';
import {BVAAllProps} from 'be-value-added/types';

export class BeBound extends BE<AP, Actions> implements Actions{
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
            resolved: true,
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
                enhancedElement.addEventListener(localEvent, e => {
                    evalBindRules(self, 'local');
                });
            }else{
                switch(localName){
                    case 'meta':{
                        debugger;
                        import('be-value-added/be-value-added.js');
                        const beValueAdded = await  (<any>enhancedElement).beEnhanced.whenResolved('be-value-added') as BVAAllProps & EventTarget;
                        bindingRule.localSignal = new WeakRef<BVAAllProps>(beValueAdded);
                        beValueAdded.addEventListener('value-changed', e => {
                            evalBindRules(self, 'local');
                        });
                        break;
                    }
 
                    default:
                        throw 'NI';
                }
            }
            //similar code as be-pute/be-switched -- share somehow?
            switch(remoteType){
                case '/':
                    
                    const host = await findRealm(enhancedElement, 'hostish');
                    if(!host) throw 404;
                    import('be-propagating/be-propagating.js');
                    //console.log('begin attaching be-propagating');
                    const bePropagating = await (<any>host).beEnhanced.whenResolved('be-propagating') as BPActions;
                    //console.log('end attaching be-propagating');
                    const signal = await bePropagating.getSignal(remoteProp!);
                    bindingRule.remoteSignal = new WeakRef(signal);
                    //console.log('end remote hydrate');
                    signal.addEventListener('value-changed', e => {
                        evalBindRules(self, 'remote');
                    });
            }
        }
        evalBindRules(self, 'tie');
        return {
            resolved: true,
        }
    }

    async onCamelized(self: this): ProPAP {
        const {With, Between} = self;
        let withBindingRules: Array<BindingRule> = [];
        if(With !== undefined){
            const {prsWith} = await import('./prsWith.js');
            withBindingRules = prsWith(self);
        }
        return {
            bindingRules: [...withBindingRules]
        };
    }


}

const typeComp: Map<string, TriggerSource> = new Map([
    ['string.undefined', 'local'],
    ['string.string', 'tie'],
    ['boolean.undefined', 'local'],
]);

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

//TODO:  replace be-linked with this one

export function getSignalVal(obj: SignalRefType){
    if(obj instanceof Element){
        if('checked' in obj){
            if(obj instanceof HTMLInputElement && obj.type === 'checkbox'){
                return obj.checked;
            }
        }
        if(obj.hasAttribute('aria-checked')){
            return obj.getAttribute('aria-checked') === 'true';
        }
        if('value' in obj){
            return obj.value;
        }
        //TODO:  hyperlinks
        return obj.textContent;
    }else{
        return obj.value;
    }
}

//TODO:  move this to be-linked.
function setSignalVal(obj: SignalRefType, val: any){
    if(obj instanceof Element){
        const typeOfVal = typeof val;
        if('checked' in obj && typeOfVal === 'boolean'){
            obj.checked = val;
            return;
        }
        //TODO:  aria-checked?
        // if(obj.hasAttribute('aria-checked')){
        //     return obj.setAttribute('aria-checked' === 'true';
        // }
        if('value' in obj && typeOfVal === 'string'){
            obj.value = val;
            return;
        }
        //TODO:  hyperlinks
        obj.textContent = val.toString();
    }else{
        obj.value = val;
    }
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
                ifNoneOf: ['With', 'Between']
            },
            onCamelized:{
                ifAllOf: ['isParsed'],
                ifAtLeastOneOf: ['With', 'Between'],
            },
            hydrate: 'bindingRules'
        }
    },
    superclass: BeBound
});

register(ifWantsToBe, upgrade, tagName);