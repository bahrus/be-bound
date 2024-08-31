// @ts-check
import { config as beCnfg } from 'be-enhanced/config.js';
import { BE } from 'be-enhanced/BE.js';
import { parse } from 'trans-render/dss/parse.js';
import { getDefaultRemotePropName } from 'trans-render/asmr/getDefaultRemotePropName.js';
import { ASMR } from 'trans-render/asmr/asmr.js';
import { find } from 'trans-render/dss/find.js';
/** @import {BEConfig, IEnhancement, BEAllProps} from './ts-refs/be-enhanced/types.d.ts' */
/** @import {Actions, PAP, AllProps, AP, BAP} from './ts-refs/be-bound/types.d.ts' */;

/**
 * @implements {Actions}
 * 
 */
class BeBound extends BE {
    /**
     * @type {BEConfig<BAP, Actions & IEnhancement, any>}
     */
    static config = {
        propInfo: {
            ...beCnfg.propInfo,
            bindingRules: {},
            rawStatements: {},
            bindings: {},
        },
        compacts: {
            when_bindingRules_changes_invoke_getBindings: 0,
            when_bindings_changes_invoke_hydrate: 0,
            when_rawStatements_changes_invoke_onRawStatements: 0,
        },
        actions: {
            noAttrs: {
                ifNoneOf: ['bindingRules'],
            }
        }
    };
    /**
     * 
     * @param {BAP} self 
     */
    onRawStatements(self) {
        const { rawStatements } = self;
        console.error('The following statements could not be parsed.', rawStatements);
    }
    /**
     * 
     * @param {BAP} self 
     * @returns 
     */
    async getBindings(self) {
        const { bindingRules, enhancedElement } = self;
        const bindings = [];
        for (const br of bindingRules) {
            let { localEvent, localProp, remoteSpecifier } = br;
            if (localProp !== undefined && localProp.includes(':')) {
                localProp = `?.${localProp.replaceAll(':', '?.')}`;
            }
            let remoteProp;
            let remoteEvtName;
            if (remoteSpecifier === undefined) {
                remoteProp = getDefaultRemotePropName(enhancedElement);
                remoteSpecifier = await parse(`/${remoteProp}`);
            }
            else {
                // if(false){ //in some small cases
                //     remoteProp = remoteSpecifier.prop;
                // }else{
                //     //remoteProp = getDefaultRemotePropName(enhancedElement);
                // }
                const { s, prop } = remoteSpecifier;
                switch (s) {
                    case '/':
                    case '-':
                        remoteProp = prop;
                        break;
                }
                remoteEvtName = remoteSpecifier.evt;
            }
            const remoteEl = await find(enhancedElement, remoteSpecifier);
            if(remoteEl === null) throw 404;
            const remoteShareObj = await ASMR.getSO(remoteEl, {
                valueProp: remoteProp,
            });
            const remoteAbsObj = await ASMR.getAO(remoteEl, {
                propToAbsorb: remoteProp,
                evt: remoteEvtName
            });
            const localShareObj = await ASMR.getSO(enhancedElement, {
                valueProp: localProp,
            });
            const localAbsObj = await ASMR.getAO(enhancedElement, {
                propToAbsorb: localProp,
                evt: localEvent,
            });
            bindings.push({
                localAbsObj,
                localShareObj,
                remoteAbsObj,
                remoteShareObj
            });
        }
        return {
            bindings
        };
    }
    /**
     * 
     * @param {BAP} self 
     * @returns 
     */
    async hydrate(self) {
        const { bindings, enhancedElement } = self;
        for (const binding of bindings) {
            const { localAbsObj, remoteAbsObj, localShareObj, remoteShareObj} = binding;
            localAbsObj.addEventListener('value', async (e) => {
                const val = await localAbsObj.getValue();
                remoteShareObj.setValue(val);
            });
            remoteAbsObj.addEventListener('value', async (e) => {

                const val = await remoteAbsObj.getValue();
                localShareObj.setValue(val);
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
        const remoteProp = getDefaultRemotePropName(enhancedElement);
        const remoteSpecifier = await parse(`/${remoteProp}`);
        const remoteEl = await find(enhancedElement, remoteSpecifier);
        if(remoteEl === null) throw 404;
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
                    remoteAbsObj,
                    remoteShareObj,
                    localShareObj,
                    localAbsObj,
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

await BeBound.bootUp();
export { BeBound };
