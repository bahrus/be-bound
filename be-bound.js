import { BE, propDefaults, propInfo } from 'be-enhanced/BE.js';
import { XE } from 'xtal-element/XE.js';
import { getLocalSignal, getRemoteProp } from 'be-linked/defaults.js';
export class BeBound extends BE {
    //#abortControllers: Array<AbortController>  = [];
    detach() {
        //TODO:  detach individual binds
        // for(const ac of this.#abortControllers){
        //     ac.abort();
        // }
    }
    static get beConfig() {
        return {
            parse: true,
            parseAndCamelize: true,
            isParsedProp: 'isParsed'
        };
    }
    async noAttrs(self) {
        const { enhancedElement } = self;
        const defltLocal = await getDfltLocal(self);
        self.bindingRules = [{
                ...defltLocal,
                remoteElO: {
                    elType: '/',
                    prop: getRemoteProp(enhancedElement),
                }
            }];
        return {
        //resolved: true,
        };
    }
    //TODO:  abort signals, clean up
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
    async onCamelized(self) {
        const { With, Between, with: w, between } = self;
        let withBindingRules = [];
        let betweenBindingRules = [];
        if ((With || w) !== undefined) {
            const { prsWith } = await import('./prsWith.js');
            withBindingRules = prsWith(self);
        }
        if (Between !== undefined || between !== undefined) {
            const { prsBetween } = await import('./prsBetween.js');
            betweenBindingRules = prsBetween(self);
        }
        return {
            bindingRules: [...withBindingRules, ...betweenBindingRules]
        };
        // const dflt = await getDfltLocal(self);
        // return {
        //     bindingRules: [
        //         ...withBindingRules.map(x => ({...dflt, ...x})), 
        //         ...betweenBindingRules.map(x => ({...dflt, ...x}))
        //     ],
        // };
    }
}
export const strType = String.raw `\||\#|\@|\/|\-`;
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
export const tagName = 'be-bound';
const xe = new XE({
    config: {
        tagName,
        isEnh: true,
        propDefaults: {
            ...propDefaults,
        },
        propInfo: {
            ...propInfo
        },
        actions: {
            noAttrs: {
                ifAllOf: ['isParsed'],
                ifNoneOf: ['With', 'Between', 'with', 'between']
            },
            onCamelized: {
                ifAllOf: ['isParsed'],
                ifAtLeastOneOf: ['With', 'Between', 'with', 'between'],
            },
            hydrate: 'bindingRules'
        }
    },
    superclass: BeBound
});
