import { define } from 'be-decorated/DE.js';
import { register } from 'be-hive/register.js';
import { BoundInstance } from './BoundInstance.js';
export class BeBound {
    onProps({ propBindings, proxy }) {
        const host = proxy.getRootNode().host;
        for (const propBinding of propBindings) {
            const [childProp, hostProp, options] = propBinding;
            const bi = new BoundInstance(childProp, hostProp, proxy, host, options);
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
