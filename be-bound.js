import { define } from 'be-decorated/DE.js';
import { register } from 'be-hive/register.js';
export class BeBound {
    async onProps({ propBindings: propBindingOrBindings, proxy, self }) {
        const { getHost } = await import('trans-render/lib/getHost.js');
        const host = getHost(self, true);
        if (host === null)
            throw '404';
        const { BoundInstance } = await import('./BoundInstance.js');
        const propBindings = Array.isArray(propBindingOrBindings) ? propBindingOrBindings : [propBindingOrBindings];
        for (const propBindingOrString of propBindings) {
            const propBinding = (typeof propBindingOrString === 'string' ? ['value', propBindingOrString] : propBindingOrString);
            const [childProp, hostProp, options] = propBinding;
            const bi = new BoundInstance(childProp, hostProp, self, host, options);
        }
    }
}
const tagName = 'be-bound';
const ifWantsToBe = 'bound';
export const upgrade = '*';
define({
    config: {
        tagName,
        propDefaults: {
            upgrade,
            ifWantsToBe,
            primaryProp: 'propBindings',
            primaryPropReq: true,
            virtualProps: ['propBindings']
        },
        actions: {
            onProps: 'propBindings'
        }
    },
    complexPropDefaults: {
        controller: BeBound,
    }
});
register(ifWantsToBe, upgrade, tagName);
