import {BE, propDefaults, propInfo} from 'be-enhanced/BE.js';
import {BEConfig} from 'be-enhanced/types';
import {XE} from 'xtal-element/XE.js';
import {Actions, AllProps, AP, ProPAP, BindingRule} from './types';
import {getLocalSignal, getRemoteProp} from 'be-linked/defaults.js';

export class BeBound extends BE<AP, Actions> implements Actions{
    //#abortControllers: Array<AbortController>  = [];
    detach(): void {
        //TODO:  detach individual binds
        // for(const ac of this.#abortControllers){
        //     ac.abort();
        // }
    }
    static override get beConfig(){
        return {
            parse: true,
            parseAndCamelize: true,
            isParsedProp: 'isParsed'
        } as BEConfig;
    }

    async noAttrs(self: this): ProPAP {
        const {enhancedElement} = self;
        const defltLocal = await getDfltLocal(self);
        self.bindingRules = [{
            ...defltLocal,
            remoteSpecifier: {
                s: '/',
                prop: getRemoteProp(enhancedElement),
                host: true
            }
            
        }];
        return {
            //resolved: true,
        };
    }

    //TODO:  abort signals, clean up
    async hydrate(self: this){
        const {bindingRules} = self;
        //const {localName} = enhancedElement;
        const {Bind} = await import('./Bind.js');
        for(const bindingRule of bindingRules!){
            const bind = new Bind(bindingRule);
            await bind.do(self);
        }


        return {
            resolved: true,
        }
    }

    async onCamelized(self: this): ProPAP {
        const {With, Between, with: w, between} = self;
        let withBindingRules: Array<BindingRule> = [];
        let betweenBindingRules: Array<BindingRule> = [];
        if((With || w ) !== undefined){
            const {prsWith} = await import('./prsWith.js');
            withBindingRules = await prsWith(self);
        }
        if(Between !== undefined || between !== undefined){
            const {prsBetween} = await import('./prsBetween.js');
            betweenBindingRules = await prsBetween(self);
        }
        return {
            bindingRules: [...withBindingRules, ...betweenBindingRules]
        };

    }


}



export const strType = String.raw `\||\#|\@|\/|\-`;

//TODO  Use getDefltLocalProp from 'be-linked';
export async function getDfltLocal(self: AP){
    const {enhancedElement} = self;
    const tbd = await getLocalSignal(enhancedElement);
    const localProp = tbd.prop;
    const {localName} = enhancedElement;
    return {
        localEvent: localName === 'input' || enhancedElement.hasAttribute('contenteditable') ? 'input' : undefined,
        localProp,
    } as BindingRule;
}




// async function evalBindRules(self: BeBound, src: TriggerSource){
//     //console.log('evalBindRules', src);
//     const {bindingRules} = self;
//     const {Bind} = await import('./Bind.js');
//     for(const bindingRule of bindingRules!){
//         const bind = new Bind(bindingRule);
//     }
// }

export interface BeBound extends AllProps{}

export const tagName = 'be-bound';


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
                ifNoneOf: ['With', 'Between', 'with', 'between']
            },
            onCamelized:{
                ifAllOf: ['isParsed'],
                ifAtLeastOneOf: ['With', 'Between', 'with', 'between'],
            },
            hydrate: 'bindingRules'
        }
    },
    superclass: BeBound
});

