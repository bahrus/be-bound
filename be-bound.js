import { BE, propDefaults, propInfo } from 'be-enhanced/BE.js';
import { XE } from 'xtal-element/XE.js';
import { register } from 'be-hive/register.js';
export class BeBound extends BE {
    static get beConfig() {
        return {
            parse: true,
            primaryProp: 'propBindings',
            primaryPropReq: true
        };
    }
    async onProps(self) {
        const { propBindings: propBindingOrBindings, enhancedElement } = self;
        const { getHost } = await import('trans-render/lib/getHost.js');
        const host = getHost(enhancedElement, true);
        if (host === null)
            throw '404';
        const { BoundInstance } = await import('./BoundInstance.js');
        const propBindings = Array.isArray(propBindingOrBindings) ? propBindingOrBindings : [propBindingOrBindings];
        for (const propBindingOrString of propBindings) {
            const propBinding = (typeof propBindingOrString === 'string' ? ['value', propBindingOrString] : propBindingOrString);
            const [childProp, hostProp, options] = propBinding;
            const bi = new BoundInstance(childProp, hostProp, enhancedElement, host, options);
        }
    }
}
const tagName = 'be-bound';
const ifWantsToBe = 'bound';
const upgrade = '*';
const xe = new XE({
    config: {
        tagName,
        propDefaults: {
            ...propDefaults
        },
        propInfo: {
            ...propInfo
        },
        actions: {
            onProps: 'propBindings'
        }
    },
    superclass: BeBound
});
register(ifWantsToBe, upgrade, tagName);
