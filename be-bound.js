import { config as beCnfg } from 'be-enhanced/config.js';
import { BE } from 'be-enhanced/BE.js';
import { getLocalSignal, getRemoteProp } from 'be-linked/defaults.js';
import { parse } from 'trans-render/dss/parse.js';
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
            },
            noAttrs: {
                ifNoneOf: ['bindingRules']
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
    async noAttrs(self) {
        const { enhancedElement } = self;
        const defltLocal = await getDfltLocal(self);
        const { localProp } = defltLocal;
        const remoteProp = await getRemoteProp(enhancedElement);
        const test = await parse(`/${remoteProp}`);
        return {
            bindingRules: [{
                    ...defltLocal,
                    remoteSpecifier: test
                }]
        };
    }
}
//TODO  Use getDefltLocalProp from 'be-linked';
export async function getDfltLocal(self) {
    const { enhancedElement } = self;
    const tbd = await getLocalSignal(enhancedElement);
    const localProp = tbd.prop;
    const { localName } = enhancedElement;
    return {
        localEvent: localName === 'input' || enhancedElement.hasAttribute('contenteditable') ? 'input' : undefined,
        localProp,
    };
}
