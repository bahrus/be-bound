import {AP, ProPAP, PAP, BindingRule, SignalEnhancement} from './types';
import {ElTypes} from 'be-linked/types';
import {RegExpOrRegExpExt} from 'be-enhanced/types';
import {arr, tryParse} from 'be-enhanced/cpu.js';
import {getDfltLocal, strType} from './be-bound.js';

const reBetweenBindingStatement: Array<RegExpOrRegExpExt<BindingRule>> = [
    {
        regExp: new RegExp(String.raw `^(?<localProp>[\w]+)(?<!\\)And(?<remoteType>${strType})(?<remoteProp>[\w\-]+)`),
        defaultVals: {}
    }
];

export function prsBetween(self: AP) : Array<BindingRule>{
    const {Between, between} = self;
    const both = [...(Between || []), ...(between || [])];
    const bindingRules: Array<BindingRule> = [];
    for(const betweenStatement of both){
        const test = tryParse(betweenStatement, reBetweenBindingStatement) as BindingRule;
        if(test === null) throw 'PE';  //Parse Error
        bindingRules.push(test);
    }
    return bindingRules;
}