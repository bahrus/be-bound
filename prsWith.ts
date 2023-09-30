import {AP, ProPAP, PAP, BindingRule, SignalEnhancement} from './types';
import {ElTypes} from 'be-linked/types';
import {RegExpOrRegExpExt} from 'be-enhanced/types';
import {arr, tryParse} from 'be-enhanced/cpu.js';

const strType = String.raw `\$|\#|\@|\/|\-`;
const reBindingStatement: Array<RegExpOrRegExpExt<BindingRule>> = [
    {
        regExp: new RegExp(String.raw `^(?<remoteType>${strType})(?<remoteProp>[\w]+)`),
        defaultVals: {}
    }
];

//TODO: move to be-linked
const enhancementMap: Map<ElTypes, SignalEnhancement> = new Map();
enhancementMap.set('')

export function prsWith(self: AP) : PAP {
    const {To} = self;
    const bindingRules: Array<BindingRule> = [];
    for(const to of To!){
        const test = tryParse(to, reBindingStatement) as BindingRule;
        if(test === null) throw 'PE'; //Parse Error
        const {remoteType} = test;
        bindingRules.push(test);
    }
    return {
        bindingRules
    }
}