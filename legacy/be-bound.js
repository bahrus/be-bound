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
        const { findRealm } = await import('trans-render/lib/findRealm.js');
        const host = await findRealm(enhancedElement, 'hostish');
        if (host === null)
            throw '404';
        const { BoundInstance } = await import('./BoundInstance.js');
        const propBindings = Array.isArray(propBindingOrBindings) ? propBindingOrBindings : [propBindingOrBindings];
        for (const propBindingOrString of propBindings) {
            const propBinding = (typeof propBindingOrString === 'string' ? ['value', propBindingOrString] : propBindingOrString);
            const [childProp, hostProp, options] = propBinding;
            const bi = new BoundInstance(childProp, hostProp, enhancedElement, host, options);
        }
        return {
            resolved: true,
        };
    }
}
const tagName = 'be-bound';
const ifWantsToBe = 'bound';
const upgrade = '*';
const xe = new XE({
    config: {
        tagName,
        isEnh: true,
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
