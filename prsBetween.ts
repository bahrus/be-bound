import {AP, ProPAP, PAP, BindingRule, SignalEnhancement} from './types';
import {ElTypes} from 'be-linked/types';
import {RegExpOrRegExpExt} from 'be-enhanced/types';
import {arr, tryParse} from 'be-enhanced/cpu.js';
import {getDfltLocal} from './be-bound.js';

const reBetweenBindingStatement: Array<RegExpOrRegExpExt<BindingRule>> = [
    {
        regExp: new RegExp(String.raw ``),
        defaultVals: {}
    }
];

export function prsBetween(self: AP) : Array<BindingRule>{
    const {Between} = self;

    const bindingRules: Array<BindingRule> = [];

    return bindingRules;
}