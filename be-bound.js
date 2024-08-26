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
        const { bindings, enhancedElement } = self;
        for (const binding of bindings) {
            const { localAbsObj, remoteAbsObj, localShareObj, remoteShareObj, remoteRef } = binding;
            localAbsObj.addEventListener('value', async (e) => {
                const remoteEl = remoteRef.deref();
                if (remoteEl === undefined) {
                    //TODO:  cancel binding?
                    //find again?
                    return;
                }
                const val = await localAbsObj.getValue(enhancedElement);
                remoteShareObj.setValue(remoteEl, val);
            });
            remoteAbsObj.addEventListener('value', async (e) => {
                const remoteEl = remoteRef.deref();
                if (remoteEl === undefined) {
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
        };
    }
    async reconcileValues(self, binding) {
        const { enhancedElement } = self;
        const { localAbsObj, localShareObj, remoteAbsObj, remoteShareObj, remoteRef } = binding;
        const localVal = await localAbsObj.getValue(enhancedElement);
        const remoteEl = remoteRef.deref();
        if (remoteEl === undefined) {
            //TODO:  cancel binding?
            //find again?
            return;
        }
        const remoteVal = await remoteAbsObj.getValue(remoteEl);
        const hs = breakTie(localVal, remoteVal);
        switch (hs) {
            case 'lhs':
                remoteShareObj.setValue(remoteEl, localVal);
                break;
            case 'rhs':
                localShareObj.setValue(enhancedElement, remoteVal);
                break;
        }
    }
    async noAttrs(self) {
        const { enhancedElement } = self;
        // const defltLocal = await getDfltLocal(self);
        // const {localProp} = defltLocal;
        const remoteProp = getDefaultRemotePropName(enhancedElement);
        const remoteSpecifier = await parse(`/${remoteProp}`);
        const { find } = await import('trans-render/dss/find.js');
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
        };
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
];
function breakTie(lhs, rhs) {
    if (lhs === rhs)
        return 'eq';
    const lhsType = lhs === null ? 'null' : typeof lhs;
    const rhsType = rhs === null ? 'null' : typeof rhs;
    const lhsTypeScore = typeRankings.indexOf(lhsType);
    const rhsTypeScore = typeRankings.indexOf(rhsType);
    if (lhsTypeScore > rhsTypeScore)
        return 'lhs';
    if (rhsTypeScore > lhsTypeScore)
        return 'rhs';
    switch (lhsType) {
        case 'string':
            if (lhs.length > rhs.length)
                return 'lhs';
            if (rhs.length > lhs.length)
                return 'rhs';
        default:
            if (lhs > rhs)
                return 'lhs';
            if (rhs > lhs)
                return 'rhs';
    }
    return 'eq';
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
