// @ts-check
/** @import {Actions, PAP, AllProps, AP, BindingRule} from './types/be-bound/types' */;
/** @import {RoundaboutOptions} from './types/roundabout/types' */;
/** @import {ElementEnhancementGateway, SpawnContext} from './types/assign-gingerly/types' */;
/** @import {EMC} from './types/mount-observer/types' */;
/** @import {RAConfig} from './types/roundabout/types' */;
/** @import {Infer} from './types/inferencer/types' */
/**


/**
 * @implements {Actions}
 */
class BeBound {

    /**
     * @this {AllProps & Actions}
     * @param {Element & ElementEnhancementGateway} enhancedElement 
     * @param {SpawnContext} ctx 
     * @param {AllProps} initVals 
     */
    constructor(enhancedElement, ctx, initVals){
        this.init(this, enhancedElement, ctx, initVals);
    }

    /**
     * @param {AllProps} self 
     * @param {Element & ElementEnhancementGateway} enhancedElement 
     * @param {SpawnContext} ctx 
     * @param {PAP} initVals 
     */
    async init(self, enhancedElement, ctx, initVals){
        const {customData} = /** @type {EMC<any, AllProps, Element, RAConfig<AllProps, Actions>>} */ (ctx.emc);
        /**
         * @type {RoundaboutOptions}
         */
        const raOptions = {
            ...customData,
            vm: self,
            initialPropVals: {
                enhancedElement,
                ...customData?.defaultPropVals,
                ...initVals
            }
        };
        (await import('roundabout-lib/roundabout.js')).roundabout(raOptions);
    }

    // /**
    //  * 
    //  * @param {AP} self 
    //  */
    // onRawStatements(self) {
    //     const { rawStatements } = self;
    //     console.error('The following statements could not be parsed.', rawStatements);
    // }

    /**
     * 
     * @param {AP} self 
     * @returns 
     */
    async getBindings(self) {
        // const { bindingRules, enhancedElement } = self;
        // if(!bindingRules || !bindingRules.success) {
        //     return {bindings: []};
        // }
        
        // const {parse} = await import('trans-render/dss/parse.js');
        // const {stdProp} = await import('trans-render/asmr/stdProp.js');
        // const {ASMR} = await import('trans-render/asmr/asmr.js');
        // const {find} = await import('trans-render/dss/find.js');
        
        // const bindings = [];
        // for (const statement of bindingRules.statements) {
        //     const br = statement.value;
        //     let { localEvent, localProp, remoteSpecifierString } = br;
        //     if (localProp !== undefined && localProp.includes(':')) {
        //         localProp = `?.${localProp.replaceAll(':', '?.')}`;
        //     }
        //     let remoteProp;
        //     let remoteEvtName;
        //     let remoteSpecifier;
        //     if (remoteSpecifierString === undefined) {
        //         remoteProp = stdProp(enhancedElement);
        //         if(remoteProp === undefined) throw 500;
        //         remoteSpecifier = await parse(`?.${remoteProp}`);
        //     }
        //     else {
        //         remoteSpecifier = await parse(remoteSpecifierString);
        //         const { prop, evtName } = remoteSpecifier;
        //         remoteProp = prop;
        //         remoteEvtName = evtName;
        //     }
        //     const remoteEl = await find(enhancedElement, remoteSpecifier);
        //     if(remoteEl === null || remoteEl === undefined) throw 404;
        //     const remoteShareObj = await ASMR.getSO(remoteEl, {
        //         valueProp: remoteProp,
        //     });
        //     const remoteAbsObj = await ASMR.getAO(remoteEl, {
        //         propToAbsorb: remoteProp,
        //         evt: remoteEvtName
        //     });
        //     const localShareObj = await ASMR.getSO(enhancedElement, {
        //         valueProp: localProp,
        //     });
        //     const localAbsObj = await ASMR.getAO(enhancedElement, {
        //         propToAbsorb: localProp,
        //         evt: localEvent,
        //     });
        //     bindings.push({
        //         localAbsObj,
        //         localShareObj,
        //         remoteAbsObj,
        //         remoteShareObj
        //     });
        // }
        // return /** @type {PAP} */ ({
        //     bindings
        // });
    }

    // /**
    //  * 
    //  * @param {AbsorbingObject} localAbsObj 
    //  * @param {SharingObject} remoteShareObj 
    //  */
    // addLocalAbs(localAbsObj, remoteShareObj){
    //     localAbsObj.addEventListener('.', async (e) => {
    //         const val = await localAbsObj.getValue();
    //         remoteShareObj.setValue(val);
    //     });
    // }

    // addRemoteAbs(remoteAbsObj, localShareObj){
    //     remoteAbsObj.addEventListener('.', async (e) => {
    //         const val = await remoteAbsObj.getValue();
    //         localShareObj.setValue(val);
    //     });
    // }

    /**
     * @type {AbortController | undefined}
     */
    #abortController;

    /**
     * 
     * @param {AP & Actions} self 
     * @returns 
     */
    async hydrate(self) {
        if(this.#abortController !== undefined) this.#abortController.abort();
        this.#abortController = new AbortController();
        const { bindingRules, enhancedElement } = self;
        console.log({bindingRules});
        const {statements, success} = bindingRules;
        if(!success) throw 400;
        if(statements.length === 0){
             const inference = await infer(enhancedElement);
             statements.push({
                value: {
                    remoteProp: inference.defaultRemoteBindingPropName
                }
             });

        }
        const {upSearch} = await import('inferencer/upSearch.js');

        for(const statement of statements){
            const {value} = statement;
            if(!value) throw 400;
            const {remoteId, remoteProp} = value;
            const target = /** @type {any} */ (await upSearch(enhancedElement, remoteId));
            console.log({target});
            const inference = await infer(target);
            const propagator = await inference.getPropagator();
            propagator.addEventListener(remoteProp, e => {
                self.reconcileValues(self, value, 'rToL');
                console.log({e});
            });

        }
        // for (const binding of bindings) {
        //     const { localAbsObj, remoteAbsObj, localShareObj, remoteShareObj} = binding;
        //     this.addLocalAbs(localAbsObj, remoteShareObj);
        //     this.addRemoteAbs(remoteAbsObj, localShareObj);
        //     this.reconcileValues(self, binding);
        // }
        // return {
        //     resolved: true,
        // };
    }

    /**
     * 
     * @param {AP} self 
     * @param {BindingRule} rule
     * @param {'rToL' | 'lToR'} direction
     * @returns 
     */
    async reconcileValues(self, rule, direction) {
        const { enhancedElement } = self;
        const {localProp, remoteProp, remoteId} = rule;
        const {upSearch} = await import('inferencer/upSearch.js');
        const remoteTarget = /** @type {any} */ (await upSearch(enhancedElement, remoteId));
        switch(direction){
            case 'rToL':
                const remoteVal = remoteTarget[remoteProp || 'value'];
                console.log(remoteVal);
                break;
        }

        //TODO: cache upSearch results

        // const { localAbsObj, localShareObj, remoteAbsObj, remoteShareObj} = rule;
        // const localVal = await localAbsObj.getValue();
        // const remoteVal = await remoteAbsObj.getValue();
        // const {breakTie} = await import('trans-render/lib/breakTie.js');
        // const hs = breakTie(localVal, remoteVal);
        // switch (hs) {
        //     case 'lhs':
        //         remoteShareObj.setValue(localVal);
        //         break;
        //     case 'rhs':
        //         localShareObj.setValue(remoteVal);
        //         break;
        // }
    }

    /**
     * 
     * @param {AP} self 
     * @returns 
     */
    async noAttrs(self) {
        const { enhancedElement } = self;
        const inference = await infer(enhancedElement);
        return /** @type {PAP} */({
            bindingRules: {
                success: true,
                statements: [
                    {
                        value: {
                            remoteProp: inference.defaultRemoteBindingPropName
                        }
                    }
                ]
            }
        });
        // const {parse} = await import('trans-render/dss/parse.js');
        // const {stdProp} = await import('trans-render/asmr/stdProp.js');
        // const {ASMR} = await import('trans-render/asmr/asmr.js');
        // const {find} = await import('trans-render/dss/find.js');
        
        // const remoteProp = stdProp(enhancedElement);
        // const remoteSpecifier = await parse(`/${remoteProp}`);
        // const remoteEl = await find(enhancedElement, remoteSpecifier);
        // if(remoteEl === null) throw 404;
        // const remoteShareObj = await ASMR.getSO(remoteEl, {
        //     valueProp: remoteProp
        // });
        // const remoteAbsObj = await ASMR.getAO(remoteEl, {
        //     propToAbsorb: remoteProp
        // });
        // const localShareObj = await ASMR.getSO(enhancedElement);
        // const localAbsObj = await ASMR.getAO(enhancedElement);
        // return {
        //     bindings: [{
        //             remoteAbsObj,
        //             remoteShareObj,
        //             localShareObj,
        //             localAbsObj,
        //         }]
        // };
    }
}

export { BeBound };

/**
 * 
 * @param {Element & ElementEnhancementGateway} from 
 */
async function infer(from){return /** @type {Infer} */ (/** @type {any} */ (from.enh.get((await import('inferencer/inferencer.js')).registryItem)));}
