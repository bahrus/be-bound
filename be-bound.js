import { config as beCnfg } from 'be-enhanced/config.js';
import { BE } from 'be-enhanced/BE.js';
export class BeBound extends BE {
    static config = {
        propInfo: {
            ...beCnfg.propInfo,
            bindingRules: {},
            rawStatements: {},
        },
        actions: {
            hydrate: {
                ifAllOf: ['bindingRules']
            },
            onRawStatements: {
                ifAllOf: ['rawStatements']
            }
        }
    };
    onRawStatements(self) {
        const { rawStatements } = self;
        console.error('The following statements could not be parsed.', rawStatements);
    }
    async hydrate(self) {
        const { bindingRules } = self;
        console.log({ bindingRules });
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
