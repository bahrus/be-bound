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
                    remoteProp: inference.defaultRemoteBindingPropName,
                    localProp: inference.valueProperty,
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
                enhancedElement[localProp] = remoteVal;
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
