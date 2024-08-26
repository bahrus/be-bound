import {config as beCnfg} from 'be-enhanced/config.js';
import {BE, BEConfig} from 'be-enhanced/BE.js';
import {Actions, AllProps, AP, Binding, BindingRule, PAP} from './types';
import {IEnhancement,  BEAllProps} from './ts-refs/trans-render/be/types';
//import {getLocalSignal, getRemoteProp} from 'be-linked/defaults.js';
import {parse} from 'trans-render/dss/parse.js';
import {getDefaultRemotePropName} from 'trans-render/asmr/getDefaultRemotePropName.js';
import {ASMR} from 'trans-render/asmr/asmr.js';

class BeBound extends BE implements Actions{
    static override config: BEConfig<AP & BEAllProps, Actions & IEnhancement, any> = {
        propInfo:{
            ...beCnfg.propInfo,
            bindingRules: {},
            rawStatements: {},
            bindings: {},
        },
        actions: {
            hydrate:{
                //ifAllOf: ['bindingRules']
                ifAllOf: ['bindings']
            },
            onRawStatements:{
                ifAllOf: ['rawStatements']
            },
            noAttrs:{
                ifNoneOf: ['bindingRules']
            }
        }
    }
    onRawStatements(self: this): void {
        const {rawStatements} = self;
        console.error('The following statements could not be parsed.', rawStatements);
        
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
            remoteAbsObj.addEventListener('value', e => {
                
            });
            this.reconcileValues(binding);

        }
        return {
            resolved: true,
        } as PAP;
    }

    async reconcileValues(binding: Binding){
        const {localAbsObj, localShareObj, remoteAbsObj, remoteShareObj} = binding;
    }

    async noAttrs(self: this) {
        const {enhancedElement} = self;
        // const defltLocal = await getDfltLocal(self);
        // const {localProp} = defltLocal;
        const remoteProp = getDefaultRemotePropName(enhancedElement);
        const remoteSpecifier = await parse(`/${remoteProp}`);
        const {find} = await import('trans-render/dss/find.js');
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