import { BE } from 'be-enhanced/BE.js';
export class BeBound extends BE {
    async hydrate(self) {
        const { bindingRules } = self;
        //const {localName} = enhancedElement;
        const { Bind } = await import('./Bind.js');
        for (const bindingRule of bindingRules) {
            const bind = new Bind(bindingRule);
            await bind.do(self);
        }
        return {
            resolved: true,
        };
    }
}
