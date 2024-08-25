import { config as beCnfg } from 'be-enhanced/config.js';
import { BE } from 'be-enhanced/BE.js';
//import {getLocalSignal, getRemoteProp} from 'be-linked/defaults.js';
import { parse } from 'trans-render/dss/parse.js';
import { getDefaultRemotePropName } from 'trans-render/asmr/getDefaultRemotePropName.js';
import { ASMR } from 'trans-render/asmr/asmr.js';
class BeBound extends BE {
    static config = {
        propInfo: {
            ...beCnfg.propInfo,
            bindingRules: {},
            rawStatements: {},
            bindings: {},
        },
        actions: {
            hydrate: {
                //ifAllOf: ['bindingRules']
                ifAllOf: ['bindings']
            },
            onRawStatements: {
                ifAllOf: ['rawStatements']
            },
            noAttrs: {
                ifNoneOf: ['bindingRules']
            }
        }
    };
    onRawStatements(self) {
        const { rawStatements } = self;
        console.error('The following statements could not be parsed.', rawStatements);
    }
    async hydrate(self) {
        // const {bindingRules} = self;
        // console.log({bindingRules});
        // const {Bind} = await import('./Bind.js');
        // for(const bindingRule of bindingRules!){
        //     const bind = new Bind(bindingRule);
        //     await bind.do(self);
        // }
        const { bindings } = self;
        for (const binding of bindings) {
            const { localAbsObj, remoteAbsObj } = binding;
            localAbsObj.addEventListener('value', e => {
                this.reconcileValues(binding);
            });
            remoteAbsObj.addEventListener('value', e => {
                this.reconcileValues(binding);
            });
            this.reconcileValues(binding);
        }
        return {
            resolved: true,
        };
    }
    async reconcileValues(binding) {
        const { localAbsObj, localShareObj, remoteAbsObj, remoteShareObj } = binding;
    }
    async noAttrs(self) {
        const { enhancedElement } = self;
        // const defltLocal = await getDfltLocal(self);
        // const {localProp} = defltLocal;
        const remoteProp = getDefaultRemotePropName(enhancedElement);
        const remoteSpecifier = await parse(`/${remoteProp}`);
        const { find } = await import('trans-render/dss/find.js');
        const remoteEl = await find(enhancedElement, remoteSpecifier);
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
                    localAbsObj
                }]
        };
    }
}
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
export { BeBound };
