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
        const {With, Between} = self;
        return {};
    }
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
            noAttrs: 'isParsed'
        }
    },
    superclass: BeBound
});

register(ifWantsToBe, upgrade, tagName);