// @ts-check
/** @import {Actions, PAP, AllProps, AP, BindingRule, Directions} from './types/be-bound/types' */;
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

    /** @type {Infer | undefined} */
    #localInference;

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
             statements.push({
                value: {}
             });
        }
        const {upSearch} = await import('inferencer/upSearch.js');
        const localInference = await infer(enhancedElement);
        this.#localInference = localInference;
        const localPropagator = await localInference.getPropagator();
        for(const statement of statements){
            const {value} = statement;
            if(!value) throw 400;
            let {remoteId, remoteProp, localProp} = value;
            if(remoteProp === undefined) remoteProp = localInference.defaultRemoteBindingPropName;
            if(localProp === undefined) localProp = localInference.valueProperty;
            const target = /** @type {any} */ (await upSearch(enhancedElement, remoteId));
            console.log({target});
            const remoteInference = await infer(target);
            const remotePropagator = await remoteInference.getPropagator();
            remotePropagator.addEventListener(remoteProp, e => {
                self.reconcileValues(self, value, 'rToL');
            });
            localPropagator.addEventListener(localProp, e => {
                self.reconcileValues(self, value, 'lToR');
            });
            self.reconcileValues(self, value, 'tie');
        }

    }

    /**
     * 
     * @param {AP} self 
     * @param {BindingRule} rule
     * @param {Directions} direction
     * @returns 
     */
    async reconcileValues(self, rule, direction) {
        const { enhancedElement } = self;
        let {localProp, remoteProp, remoteId} = rule;
        if(remoteProp === undefined) remoteProp = this.#localInference?.defaultRemoteBindingPropName;
        if(localProp === undefined) localProp = this.#localInference?.valueProperty;
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
            case 'tie':
                const lhsValue = enhancedElement[localProp];
                const rhsValue = remoteTarget[remoteProp];
                const tb = breakTie(lhsValue, rhsValue);
                switch(tb){
                    case 'lhs':
                        remoteTarget[remoteProp] = enhancedElement[localProp];
                        break;
                    case 'rhs':
                        enhancedElement[localProp] = remoteTarget[remoteProp];
                        break;
                }
                break;
        }


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
/**
 * 
 * @param {any} lhs 
 * @param {any} rhs 
 * @returns 
 */
export function breakTie(lhs, rhs) {
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

export { BeBound };

/**
 * 
 * @param {Element & ElementEnhancementGateway} from 
 */
async function infer(from){return /** @type {Infer} */ (/** @type {any} */ (from.enh.get((await import('inferencer/inferencer.js')).registryItem)));}
