// @ts-check
/** @import {Actions, PAP, AllProps, AP, BindingRule, Directions} from './types/be-bound/types' */;
/** @import {RoundaboutOptions} from './types/roundabout/types' */;
/** @import {ElementEnhancementGateway, SpawnContext} from './types/assign-gingerly/types' */;
/** @import {EMC} from './types/mount-observer/types' */;
/** @import {RAConfig} from './types/roundabout/types' */;
/** @import {Infer} from './types/inferencer/types' */

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
        const {customData} = /** @type {EMC<any, AllProps, Element, RAConfig<AllProps, Actions>>} */ (ctx.emc || ctx.config);
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
        await (await import('roundabout-lib/roundabout.js')).roundabout(raOptions);
        self.initialized = true;
    }

    /**
     * Transfers the attribute-parsed `bindingRules` into `bindings` -- the
     * property `hydrate` actually reads.  Programmatic callers skip
     * `bindingRules` entirely and assign `bindings` directly.
     * Invoked via the `when_bindingRules_changes_call_onBindingRulesChange`
     * compact, never called directly.
     * @param {AP} self
     * @returns {PAP}
     */
    onBindingRulesChange(self){
        const {bindingRules} = self;
        if(bindingRules === undefined) return {};
        if(!bindingRules.success) throw 400;
        /** @type {Array<Partial<BindingRule>>} */
        const bindings = [];
        for(const statement of bindingRules.statements){
            if(statement.value !== undefined) bindings.push(statement.value);
        }
        return {bindings};
    }


    /**
     * @type {AbortController | undefined}
     */
    #abortController;

    /** @type {boolean} */
    #reconciling = false;

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
        const { enhancedElement } = self;
        // Remote elements passed by reference must only ever be held weakly --
        // including in the bindings value stored on this enhancement.
        const weakened = weakenRemoteElements(self.bindings);
        const bindings = weakened ?? self.bindings;
        const {signal} = this.#abortController;
        // Empty attribute (or empty array): a single, fully inferred rule.
        /** @type {Array<Partial<BindingRule>>} */
        const rules = bindings.length === 0 ? [{}] : bindings;
        const {upSearch} = await import('assign-gingerly/inferencer/upSearch.js');
        const localInference = await infer(enhancedElement);
        this.#localInference = localInference;
        const localPropagator = await localInference.getPropagator();
        for(const value of rules){
            let {remoteId, remoteElement, remoteProp, localProp, localEvent, remoteEvent} = value;
            const target = /** @type {any} */ (remoteElement !== undefined
                ? /** @type {WeakRef<Element>} */ (remoteElement).deref() // held weakly
                : await upSearch(enhancedElement, remoteId));
            if(target === undefined) continue; // a remote element that has been garbage collected
            const remoteInference = await infer(target);
            if(remoteProp === undefined) {
                if(remoteId === undefined && remoteElement === undefined){
                    remoteProp = localInference.defaultRemoteBindingPropName;
                }else{
                    remoteProp = remoteInference.valueProperty;
                    remoteEvent = remoteInference.eventType;
                }
                
            }
            if(localProp === undefined) localProp = localInference.valueProperty;
            
            
            
            const remotePropagator = await remoteInference.getPropagator();
            //console.log({target, remotePropagator, localPropagator, localProp, remoteProp, localEvent, remoteEvent});
            if(remoteEvent){
                // Listen for a specific DOM event on the remote element
                target.addEventListener(remoteEvent, e => {
                    self.reconcileValues(self, value, 'rToL');
                }, {signal});
            } else {
                remotePropagator.addEventListener(remoteProp, e => {
                    self.reconcileValues(self, value, 'rToL');
                }, {signal});
            }
            if(localEvent){
                // Listen for a specific DOM event on the enhanced element
                enhancedElement.addEventListener(localEvent, e => {
                    self.reconcileValues(self, value, 'lToR');
                }, {signal});
            } else {
                localPropagator.addEventListener(localProp, e => {
                    self.reconcileValues(self, value, 'lToR');
                }, {signal});
            }
            self.reconcileValues(self, value, 'tie');
        }
        if(weakened !== undefined) return /** @type {PAP} */ ({bindings: weakened});

    }

    /**
     * 
     * @param {AP} self 
     * @param {Partial<BindingRule>} rule
     * @param {Directions} direction
     * @returns 
     */
    async reconcileValues(self, rule, direction) {
        if(this.#reconciling) return;
        this.#reconciling = true;
        try {
        const { enhancedElement } = self;
        let {localProp, remoteProp, remoteId, remoteElement} = rule;
        const {upSearch} = await import('assign-gingerly/inferencer/upSearch.js');
        const remoteTarget = /** @type {any} */ (remoteElement !== undefined
            ? /** @type {WeakRef<Element>} */ (remoteElement).deref() // held weakly
            : await upSearch(enhancedElement, remoteId));
        if(remoteTarget === undefined) return; // garbage collected
        const remoteInference = await infer(remoteTarget);
        if(remoteProp === undefined) {
            if(remoteId === undefined && remoteElement === undefined){
                remoteProp = this.#localInference?.defaultRemoteBindingPropName;
            }else{
                remoteProp = remoteInference.valueProperty;
            }
            
        }
        if(localProp === undefined) localProp = this.#localInference?.valueProperty;
        
        const localValue = resolvePath(enhancedElement, localProp);
        const remoteValue = remoteTarget[remoteProp];
        if(localValue === remoteValue) return;
        switch(direction){
            case 'rToL':
                setPath(enhancedElement, localProp, remoteValue);
                break;
            case 'lToR':
                remoteTarget[remoteProp] = localValue;
                break;
            case 'tie':
                const tb = breakTie(localValue, remoteValue);
                switch(tb){
                    case 'lhs':
                        remoteTarget[remoteProp] = localValue;
                        break;
                    case 'rhs':
                        setPath(enhancedElement, localProp, remoteValue);
                        break;
                }
                break;
        }
        } finally {
            this.#reconciling = false;
        }
    }


}

/**
 * If any binding's remoteElement is an element (rather than a WeakRef), return
 * a copy of bindings with each such element wrapped in a WeakRef.  Otherwise
 * return undefined.  Never mutates bindings.
 * @param {Array<Partial<BindingRule>>} bindings
 * @returns {Array<Partial<BindingRule>> | undefined}
 */
function weakenRemoteElements(bindings){
    if(!bindings.some(b => b?.remoteElement instanceof Element)) return undefined;
    return bindings.map(b => b?.remoteElement instanceof Element
        ? {...b, remoteElement: new WeakRef(b.remoteElement)}
        : b);
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
 * Resolve a property path on an object.
 * Handles both simple props ("value") and ?. paths ("?.rating?.value").
 * @param {any} obj 
 * @param {string} path 
 * @returns {any}
 */
function resolvePath(obj, path) {
    if(!path.startsWith('?.')) return obj[path];
    const segments = path.split('?.').filter(s => s.length > 0);
    let current = obj;
    for(const seg of segments){
        if(current == null) return undefined;
        current = current[seg];
    }
    return current;
}

/**
 * Set a value at a property path on an object.
 * Handles both simple props ("value") and ?. paths ("?.rating?.value").
 * @param {any} obj 
 * @param {string} path 
 * @param {any} value 
 */
function setPath(obj, path, value) {
    if(!path.startsWith('?.')) {
        obj[path] = value;
        return;
    }
    const segments = path.split('?.').filter(s => s.length > 0);
    let current = obj;
    for(let i = 0; i < segments.length - 1; i++){
        if(current == null) return;
        current = current[segments[i]];
    }
    if(current != null){
        current[segments[segments.length - 1]] = value;
    }
}

/**
 * 
 * @param {Element & ElementEnhancementGateway} from 
 */
async function infer(from){return /** @type {Infer} */ (/** @type {any} */ (from.enh.get((await import('assign-gingerly/inferencer/inferencer.js')).registryItem)));}
