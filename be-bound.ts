import {BE, propDefaults, propInfo} from 'be-enhanced/BE.js';
import {BEConfig} from 'be-enhanced/types';
import {XE} from 'xtal-element/XE.js';
import {Actions, AllProps, AP, PAP, ProPAP, POA, TriggerSource, SpecificityResult} from './types';
import {register} from 'be-hive/register.js';
import {findRealm} from 'trans-render/lib/findRealm.js';
import {Actions as BPActions} from 'be-propagating/types';

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
        const {localName} = enhancedElement;
        let localProp = 'textContent';
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
        }
        self.bindingRules = [{
            localEvent: localName === 'input' || enhancedElement.hasAttribute('contenteditable') ? 'input' : undefined,
            localProp,
            remoteType: '/',
            remoteProp: (enhancedElement as any).name || enhancedElement.id,
        }];
        return {
            resolved: true,
        };
    }

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
            }
            //similar code as be-pute/be-switched -- share somehow?
            switch(remoteType){
                case '/':
                    const host = await findRealm(enhancedElement, 'hostish');
                    if(!host) throw 404;
                    import('be-propagating/be-propagating.js');
                    const bePropagating = await (<any>host).beEnhanced.whenResolved('be-propagating') as BPActions;
                    const signal = await bePropagating.getSignal(remoteProp!);
                    bindingRule.remoteSignal = new WeakRef(signal);
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
}

const typeComp: Map<string, TriggerSource> = new Map([
    ['string.undefined', 'local'],
    ['string.string', 'tie']
]);

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
    const {bindingRules} = self;
    for(const bindingRule of bindingRules!){
        const {localProp, remoteProp, localSignal, remoteSignal} = bindingRule;
        const localSignalDeref = localSignal?.deref() as any;
        const remoteSignalDeref = remoteSignal?.deref() as any;
        if(localSignalDeref === undefined) throw 404;
        if(remoteSignalDeref === undefined) throw 404;
        const localVal = localSignalDeref.value;
        const remoteVal = remoteSignalDeref.value;
        const tbd = compareSpecificity(localVal, remoteVal);
        const {winner, val} = tbd;
        if(winner === 'tie') continue;
        switch(winner){
            case 'local':
                remoteSignalDeref.value = val;
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
            hydrate: 'bindingRules'
        }
    },
    superclass: BeBound
});

register(ifWantsToBe, upgrade, tagName);