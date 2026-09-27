import  'assign-gingerly/object-extension.js';

/**
 * Registers be-bound's config with the enhancement registry, so it can be
 * attached programmatically via `enh.set.beBound` or `enh.get(emc)`.
 * @param {Element | undefined} ref
 */
export async function defBeBound(ref){
    const {default: emc} = await import('./emc.json', {with: {type: 'json'}});
    return await push(ref, emc);
}

async function push(ref, emc){
    const {BeBound} = await import('./be-bound.js');
    const {enhConfig} = emc;
    enhConfig.spawn = BeBound;
    enhConfig.customData = emc.customData;
    const registry = ref?.customElementRegistry ?? customElements;
    const {enhancementRegistry} = registry;
    enhancementRegistry.push(enhConfig);
    return enhConfig;
}
