import { define } from 'be-decorated/DE.js';
import { register } from 'be-hive/register.js';
export class BeBound {
    async onProps({ propBindings, proxy, self }) {
        const { getHost } = await import('trans-render/lib/getHost.js');
        const host = getHost(self);
        if (host === null)
            throw '404';
        const { BoundInstance } = await import('./BoundInstance.js');
        for (const propBinding of propBindings) {
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
