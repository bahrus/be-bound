import {BE, propDefaults, propInfo} from 'be-enhanced/BE.js';
import {BEConfig} from 'be-enhanced/types';
import {XE} from 'xtal-element/XE.js';
import {Actions, AllProps, AP, PAP, ProPAP, POA, BindingTuplet} from './types';
import {register} from 'be-hive/register.js';

export class BeBound extends BE<AP, Actions> implements Actions{
    static  override get beConfig(){
        return {
            parse: true,
            primaryProp: 'propBindings',
            primaryPropReq: true
        } as BEConfig
    }

    async onProps(self: this){
        const {propBindings: propBindingOrBindings, enhancedElement} = self;
        const {getHost} = await import('trans-render/lib/getHost.js');
        const host = getHost(enhancedElement, true);
        if(host === null) throw '404';
        const {BoundInstance} = await import('./BoundInstance.js');
        const propBindings = Array.isArray(propBindingOrBindings) ? propBindingOrBindings : [propBindingOrBindings];
        for(const propBindingOrString of propBindings!){
            const propBinding = (typeof propBindingOrString === 'string' ? ['value', propBindingOrString] : propBindingOrString) as BindingTuplet;
            const [childProp, hostProp, options] = propBinding;
            const bi = new BoundInstance(childProp, hostProp, enhancedElement, host, options);
        }
        return {
            resolved: true,
        } as PAP;
    }
}

export interface BeBound extends AllProps{}

const tagName = 'be-bound';
const ifWantsToBe = 'bound';
const upgrade = '*';

const xe = new XE<AP, Actions>({
    config: {
        tagName,
        propDefaults: {
            ...propDefaults
        },
        propInfo: {
            ...propInfo
        },
        actions:{
            onProps: 'propBindings'
        }
    },
    superclass: BeBound
});

register(ifWantsToBe, upgrade, tagName);