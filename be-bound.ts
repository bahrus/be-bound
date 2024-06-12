import {config as beCnfg} from 'be-enhanced/config.js';
import {BE, BEConfig} from 'be-enhanced/BE.js';
import {Actions, AllProps, AP, BindingRule, PAP} from './types';
import {IEnhancement,  BEAllProps} from 'trans-render/be/types';
import {getLocalSignal, getRemoteProp} from 'be-linked/defaults.js';
import {parse} from 'trans-render/dss/parse.js';

class BeBound extends BE implements Actions{
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
            },
            noAttrs:{
                ifNoneOf: ['bindingRules']
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

    async noAttrs(self: this) {
        const {enhancedElement} = self;
        const defltLocal = await getDfltLocal(self);
        const {localProp} = defltLocal;
        const remoteProp = await getRemoteProp(enhancedElement)
        const test = await parse(`/${remoteProp}`);
        return {
            bindingRules: [{
                ...defltLocal,
                remoteSpecifier: test
                
            }]
        } as PAP;
    }
}

interface BeBound extends AP{}

//TODO  Use getDefltLocalProp from 'be-linked';
export async function getDfltLocal(self: AP & BEAllProps){
    const {enhancedElement} = self;
    const tbd = await getLocalSignal(enhancedElement);
    const localProp = tbd.prop;
    const {localName} = enhancedElement;
    return {
        localEvent: localName === 'input' || enhancedElement.hasAttribute('contenteditable') ? 'input' : undefined,
        localProp,
    } as BindingRule;
}

await BeBound.bootUp();

export {BeBound}