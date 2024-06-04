import {config as beCnfg} from 'be-enhanced/config.js';
import {BE, BEConfig} from 'be-enhanced/BE.js';
import {Actions, AllProps, AP, PAP} from './types';
import { Positractions, PropInfo } from 'trans-render/froop/types';
import {IEnhancement,  BEAllProps} from 'trans-render/be/types';

export class BeBound extends BE implements Actions{
    static override config: BEConfig<AP & BEAllProps, Actions & IEnhancement, any> = {
        propInfo:{
            ...beCnfg.propInfo,
            bindingRules: {},
            rawStatements: {},
        },
        actions: {
            hydrate:{
                ifAllOf: ['bindingRules']
            },
            onRawStatements:{
                ifAllOf: ['rawStatements']
            }
        }
    }
    onRawStatements(self: this): void {
        const {rawStatements} = self;
        console.error('The following statements could not be parsed.', rawStatements);
        
    }

    async hydrate(self: this){
        const {bindingRules} = self;
        console.log({bindingRules});
        const {Bind} = await import('./Bind.js');
        for(const bindingRule of bindingRules!){
            const bind = new Bind(bindingRule);
            await bind.do(self);
        }


        return {
            resolved: true,
        } as PAP;
    }
}

export interface BeBound extends AP{}