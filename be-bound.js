import { BE, propDefaults, propInfo } from 'be-enhanced/BE.js';
import { XE } from 'xtal-element/XE.js';
import { register } from 'be-hive/register.js';
export class BeBound extends BE {
    static get beConfig() {
        return {
            parse: true,
            parseAndCamelize: true,
            isParsedProp: 'isParsed'
        };
    }
    async noAttrs(self) {
        const { enhancedElement } = self;
        const { localName } = enhancedElement;
        let localProp = 'textContent';
        switch (localName) {
            case 'input':
                const { type } = enhancedElement;
                switch (type) {
                    case 'number':
                        localProp = 'valueAsNumber';
                        break;
                    case 'checkbox':
                        localProp = 'checked';
                        break;
                    default:
                        localProp = 'value';
                }
                break;
        }
        self.bindingRules = [{
                localEvent: localName === 'input' || enhancedElement.hasAttribute('contenteditable') ? 'input' : undefined,
                localProp,
                remoteType: '/',
                remoteProp: enhancedElement.name || enhancedElement.id,
            }];
        return {
            resolved: true,
        };
    }
    async hydrate(self) {
        evalBindRules(self);
        return {
            resolved: true,
        };
    }
}
function evalBindRules(self) {
    const { bindingRules } = self;
}
const tagName = 'be-bound';
const ifWantsToBe = 'bound';
const upgrade = '*';
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
                ifNoneOf: ['With', 'Between']
            },
            hydrate: 'bindingRules'
        }
    },
    superclass: BeBound
});
register(ifWantsToBe, upgrade, tagName);
