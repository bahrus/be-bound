// @ts-check
import { propInfo, rejected, resolved } from 'be-enhanced/cc.js';
import { BE } from 'be-enhanced/BE.js';
import { parse } from 'trans-render/dss/parse.js';
import { stdProp } from 'trans-render/asmr/stdProp.js';
import { ASMR } from 'trans-render/asmr/asmr.js';
import { find } from 'trans-render/dss/find.js';
import {dispatchEvent as de} from 'trans-render/positractions/dispatchEvent.js';
/** @import {BEConfig, IEnhancement, BEAllProps} from './ts-refs/be-enhanced/types.d.ts' */
/** @import {Actions, PAP, AllProps, AP, BAP, Binding} from './ts-refs/be-bound/types.d.ts' */;
/** @import {AbsorbingObject, SharingObject} from './ts-refs/trans-render/asmr/types' */

/**
 * @implements {Actions}
 * 
 */
class BeBound extends BE {
    /**
     * @type {BEConfig<BAP, Actions & IEnhancement>}
     */
    static config = {
        propInfo: {
            ...propInfo,
            bindingRules: {},
            rawStatements: {},
            bindings: {},
        },
        compacts: {
            when_bindingRules_changes_call_getBindings: 0,
            when_bindings_changes_call_hydrate: 0,
            when_rawStatements_changes_call_onRawStatements: 0,
        },
        actions: {
            noAttrs: {
                ifNoneOf: ['bindingRules'],
            }
        },
        positractions: [resolved, rejected],
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
                remoteProp = stdProp(enhancedElement);
                if(remoteProp === undefined) throw 500;
                remoteSpecifier = await parse(`?.${remoteProp}`);
            }
            else {
                const { prop, evtName } = remoteSpecifier;
                remoteProp = prop;
                remoteEvtName = evtName;
            }
            const remoteEl = await find(enhancedElement, remoteSpecifier);
            if(remoteEl === null || remoteEl === undefined) throw 404;
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

    de = de;

    /**
     * 
     * @param {AbsorbingObject} localAbsObj 
     * @param {SharingObject} remoteShareObj 
     */
    addLocalAbs(localAbsObj, remoteShareObj){
        localAbsObj.addEventListener('.', async (e) => {
            const val = await localAbsObj.getValue();
            remoteShareObj.setValue(val);
        });
    }

    addRemoteAbs(remoteAbsObj, localShareObj){
        remoteAbsObj.addEventListener('.', async (e) => {
            const val = await remoteAbsObj.getValue();
            localShareObj.setValue(val);
        });
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
            this.addLocalAbs(localAbsObj, remoteShareObj);
            this.addRemoteAbs(remoteAbsObj, localShareObj);
            this.reconcileValues(self, binding);
        }
        return {
            resolved: true,
        };
    }
    /**
     * 
     * @param {BAP} self 
     * @param {Binding} binding 
     * @returns 
     */
    async reconcileValues(self, binding) {
        const { enhancedElement } = self;
        const { localAbsObj, localShareObj, remoteAbsObj, remoteShareObj} = binding;
        const localVal = await localAbsObj.getValue();
        const remoteVal = await remoteAbsObj.getValue();
        const {breakTie} = await import('trans-render/lib/breakTie.js');
        const hs = breakTie(localVal, remoteVal);
        switch (hs) {
            case 'lhs':
                remoteShareObj.setValue(localVal);
                break;
            case 'rhs':
                localShareObj.setValue(remoteVal);
                break;
        }
    }
    /**
     * 
     * @param {BAP} self 
     * @returns 
     */
    async noAttrs(self) {
        const { enhancedElement } = self;
        const remoteProp = stdProp(enhancedElement);
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


await BeBound.bootUp();
export { BeBound };
