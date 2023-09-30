import {BE, propDefaults, propInfo} from 'be-enhanced/BE.js';
import {BEConfig} from 'be-enhanced/types';
import {XE} from 'xtal-element/XE.js';
import {Actions, AllProps, AP, PAP, ProPAP, POA} from './types';
import {register} from 'be-hive/register.js';

export class BeBound extends BE<AP, Actions> implements Actions{
    static override get beConfig(){
        return {
            parse: true,
            parseAndCamelize: true,
            isParsedProp: 'isParsed'
        } as BEConfig;
    }

    async noAttrs(self: this): ProPAP {
        const {enhancedElement} = self;
        const {localName} = enhancedElement;
        let localProp = 'textContent';
        switch(localName){
            case 'input':
                const {type} = enhancedElement as HTMLInputElement;
                switch(type){
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
            remoteProp: (enhancedElement as any).name || enhancedElement.id,
        }];
        return {
            resolved: true,
        };
    }

    async hydrate(self: this){
        evalBindRules(self);
        return {
            resolved: true,
        }
    }
}

function evalBindRules(self: BeBound){
    const {bindingRules} = self;
}

export interface BeBound extends AllProps{}

const tagName = 'be-bound';
const ifWantsToBe = 'bound';
const upgrade = '*';

const xe = new XE<AP, Actions>({
    config:{
        tagName,
        isEnh: true,
        propDefaults: {
            ...propDefaults,
        },
        propInfo: {
            ...propInfo
        },
        actions:{
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