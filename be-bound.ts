import {config as beCnfg} from 'be-enhanced/config.js';
import {BE, BEConfig} from 'be-enhanced/BE.js';
import {Actions, AllProps, AP, Binding, BindingRule, PAP, ProPAP} from './types';
import {IEnhancement,  BEAllProps} from './ts-refs/trans-render/be/types';
//import {getLocalSignal, getRemoteProp} from 'be-linked/defaults.js';
import {parse} from 'trans-render/dss/parse.js';
import {getDefaultRemotePropName} from 'trans-render/asmr/getDefaultRemotePropName.js';
import {ASMR} from 'trans-render/asmr/asmr.js';
import {find} from 'trans-render/dss/find.js';

class BeBound extends BE implements Actions{
    static override config: BEConfig<AP & BEAllProps, Actions & IEnhancement, any> = {
        propInfo:{
            ...beCnfg.propInfo,
            bindingRules: {},
            rawStatements: {},
            bindings: {},
        },
        actions: {
            getBindings:{
                ifAllOf: ['bindingRules'],
            },
            hydrate:{
                //ifAllOf: ['bindingRules']
                ifAllOf: ['bindings'],
            },
            onRawStatements:{
                ifAllOf: ['rawStatements'],
            },
            noAttrs:{
                ifNoneOf: ['bindingRules'],
            }
        }
    }
    onRawStatements(self: this): void {
        const {rawStatements} = self;
        console.error('The following statements could not be parsed.', rawStatements);
        
    }
    async getBindings(self: this) {
        const {bindingRules, enhancedElement} = self;
        console.log({bindingRules});
        const bindings: Array<Binding> = [];
        for(const br of bindingRules!){
            let {localEvent, localProp, remoteSpecifier} = br;
            let remoteProp: string | undefined;
            let remoteEvtName: string | undefined;
            if(remoteSpecifier === undefined){
                remoteProp = getDefaultRemotePropName(enhancedElement);
                remoteSpecifier = await parse(`/${remoteProp}`);
            }else{
                // if(false){ //in some small cases
                //     remoteProp = remoteSpecifier.prop;
                // }else{
                //     //remoteProp = getDefaultRemotePropName(enhancedElement);
                // }
                
                remoteEvtName = remoteSpecifier.evt;
            }
            const remoteEl = await find(enhancedElement, remoteSpecifier);
            const remoteRef = new WeakRef(remoteEl);
            const remoteShareObj = await ASMR.getSO(remoteEl, {
                valueProp: remoteProp,
            });
            const remoteAbsObj = await ASMR.getAO(remoteEl, {
                propToAbsorb: remoteProp,
                UEEN: remoteEvtName
            });
            const localShareObj = await ASMR.getSO(enhancedElement, {
                valueProp: localProp,
            });
            const localAbsObj = await ASMR.getAO(enhancedElement, {
                propToAbsorb: localProp,
                UEEN: localEvent,
            });
            bindings.push({
                localAbsObj,
                localShareObj,
                remoteAbsObj,
                remoteRef,
                remoteShareObj
            });

        }
        return {
            bindings
        } as PAP;
    }

    async hydrate(self: this){
        // const {bindingRules} = self;
        // console.log({bindingRules});
        // const {Bind} = await import('./Bind.js');
        // for(const bindingRule of bindingRules!){
        //     const bind = new Bind(bindingRule);
        //     await bind.do(self);
        // }

        const {bindings, enhancedElement} = self;
        for(const binding of bindings!){
            const {localAbsObj, remoteAbsObj, localShareObj, remoteShareObj, remoteRef} = binding;
            localAbsObj.addEventListener('value', async e => {
                const remoteEl = remoteRef.deref();
                if(remoteEl === undefined) {
                    //TODO:  cancel binding?
                    //find again?
                    return;
                }
                const val = await localAbsObj.getValue(enhancedElement);
                remoteShareObj.setValue(remoteEl, val);
            });
            remoteAbsObj.addEventListener('value', async e => {
                const remoteEl = remoteRef.deref();
                if(remoteEl === undefined) {
                    //TODO:  cancel binding?
                    //find again?
                    return;
                }
                const val = await remoteAbsObj.getValue(remoteEl);
                localShareObj.setValue(enhancedElement, val);
            });
            this.reconcileValues(self, binding);

        }
        return {
            resolved: true,
        } as PAP;
    }

    async reconcileValues(self: this, binding: Binding){
        const {enhancedElement} = self;
        const {localAbsObj, localShareObj, remoteAbsObj, remoteShareObj, remoteRef} = binding;
        const localVal = await localAbsObj.getValue(enhancedElement);
        const remoteEl = remoteRef.deref();
        if(remoteEl === undefined) {
            //TODO:  cancel binding?
            //find again?
            return;
        }
        const remoteVal =  await remoteAbsObj.getValue(remoteEl);
        const hs = breakTie(localVal, remoteVal);
        switch(hs){
            case 'lhs':
                remoteShareObj.setValue(remoteEl, localVal);
                break;
            case 'rhs':
                localShareObj.setValue(enhancedElement, remoteVal);
                break;
        }



    }


    async noAttrs(self: this) {
        const {enhancedElement} = self;
        // const defltLocal = await getDfltLocal(self);
        // const {localProp} = defltLocal;
        const remoteProp = getDefaultRemotePropName(enhancedElement);
        const remoteSpecifier = await parse(`/${remoteProp}`);
        
        const remoteEl = await find(enhancedElement, remoteSpecifier);
        const remoteRef = new WeakRef(remoteEl);
        const remoteShareObj = await ASMR.getSO(remoteEl, {
            valueProp: remoteProp
        });
        const remoteAbsObj = await ASMR.getAO(remoteEl, {
            propToAbsorb: remoteProp
        });
        const localShareObj = await ASMR.getSO(enhancedElement);
        const localAbsObj = await ASMR.getAO(enhancedElement);
        return {
            bindings: [{
                //...defltLocal,
                remoteAbsObj,
                remoteShareObj,
                localShareObj,
                localAbsObj,
                remoteRef
            }]
        } as PAP;
    }
}

const typeRankings = [
    'undefined',
    'null',
    'string',
    'boolean',
    'number',
    'bigint',
    'symbol',
    'object',
    'function'
]

function breakTie(lhs: any, rhs: any){
    if(lhs === rhs) return 'eq';
    const lhsType = lhs === null ? 'null' : typeof lhs;
    const rhsType = rhs === null ? 'null' : typeof rhs;
    const lhsTypeScore = typeRankings.indexOf(lhsType);
    const rhsTypeScore = typeRankings.indexOf(rhsType);
    if(lhsTypeScore > rhsTypeScore) return 'lhs';
    if(rhsTypeScore > lhsTypeScore) return 'rhs';
    switch(lhsType){
        case 'string':
            if(lhs.length > rhs.length) return 'lhs';
            if(rhs.length > lhs.length) return 'rhs';
            
        default:
            if(lhs > rhs) return 'lhs';
            if(rhs > lhs) return 'rhs';
    }
    return 'eq';
}

interface BeBound extends AP{}

//TODO  Use getDefltLocalProp from 'be-linked';
// export async function getDfltLocal(self: AP & BEAllProps){
//     const {enhancedElement} = self;
//     const tbd = await getLocalSignal(enhancedElement);
//     const localProp = tbd.prop;
//     const {localName} = enhancedElement;
//     return {
//         localEvent: localName === 'input' || enhancedElement.hasAttribute('contenteditable') ? 'input' : undefined,
//         localProp,
//     } as BindingRule;
// }

await BeBound.bootUp();

export {BeBound}