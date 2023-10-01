import {AP, ProPAP, PAP, BindingRule, SignalEnhancement} from './types';
import {ElTypes} from 'be-linked/types';
import {RegExpOrRegExpExt} from 'be-enhanced/types';
import {arr, tryParse} from 'be-enhanced/cpu.js';
import {getDfltLocal} from './be-bound.js';

const strType = String.raw `\$|\#|\@|\/|\-`;
const reWithBindingStatement: Array<RegExpOrRegExpExt<BindingRule>> = [
    {
        regExp: new RegExp(String.raw `^(?<remoteType>${strType})(?<remoteProp>[\w]+)`),
        defaultVals: {
        }
    }
];

// //TODO: move to be-linked
// const enhancementMap: Map<ElTypes, SignalEnhancement> = new Map();
// enhancementMap.set('')

export function prsWith(self: AP) : Array<BindingRule> {
    const {With} = self;
    
    const bindingRules: Array<BindingRule> = [];
    const defltLocal = getDfltLocal(self);
    for(const to of With!){
        const test = tryParse(to, reWithBindingStatement) as BindingRule;
        if(test === null) throw 'PE'; //Parse Error
        
        bindingRules.push({
            ...defltLocal,
            ...test
        });
    }
    return bindingRules;
}