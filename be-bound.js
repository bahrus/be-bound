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
        const localInference = await infer(enhancedElement);
        const localPropagator = await localInference.getPropagator();
        for(const statement of statements){
            const {value} = statement;
            if(!value) throw 400;
            const {remoteId, remoteProp, localProp} = value;
            const target = /** @type {any} */ (await upSearch(enhancedElement, remoteId));
            console.log({target});
            const remoteInference = await infer(target);
            const remotePropagator = await remoteInference.getPropagator();
            remotePropagator.addEventListener(remoteProp, e => {
                self.reconcileValues(self, value, 'rToL');
            });
            localPropagator.addEventListener(localProp, e => {
                self.reconcileValues(self, value, 'lToR');
            })
        }

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
        if(enhancedElement[localProp] === remoteTarget[remoteProp]) return;
        switch(direction){
            case 'rToL':
                enhancedElement[localProp] = remoteTarget[remoteProp];
                break;
            case 'lToR':
                remoteTarget[remoteProp] = enhancedElement[localProp];
                break;
        }


    }


}

export { BeBound };

/**
 * 
 * @param {Element & ElementEnhancementGateway} from 
 */
async function infer(from){return /** @type {Infer} */ (/** @type {any} */ (from.enh.get((await import('inferencer/inferencer.js')).registryItem)));}
