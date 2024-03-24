import {AP, ProPAP, PAP, BindingRule, SignalEnhancement} from './types';
import {ElTypes} from 'be-linked/types';
import {RegExpOrRegExpExt} from 'be-enhanced/types';
import {arr, tryParse} from 'be-enhanced/cpu.js';
import {getDfltLocal, strType} from './be-bound.js';
import {prsElO} from 'trans-render/lib/prs/prsElO.js';

const reBetweenBindingStatement: Array<RegExpOrRegExpExt<BetweenStatement>> = [
    {
        regExp: new RegExp(String.raw `^(?<localInfo>[\w\:]+)(?<!\\)And(?<remoteInfo>.*)`),
        defaultVals: {}
    }
];

export function prsBetween(self: AP) : Array<BindingRule>{
    const {Between, between} = self;
    const both = [...(Between || []), ...(between || [])];
    const bindingRules: Array<BindingRule> = [];
    for(const betweenStatement of both){
        const test = tryParse(betweenStatement, reBetweenBindingStatement) as BetweenStatement;
        if(test === null) throw 'PE';  //Parse Error
        const {localInfo, remoteInfo} = test;
        const propEvent = localInfo.split('::');
        const localEvent = propEvent.length > 1 ? propEvent[1] : undefined;
        const localProp = propEvent[0].replaceAll(':', '.');
        const remoteElO = prsElO(remoteInfo);
        bindingRules.push({
            localEvent,
            localProp,
            remoteElO
        });
        //bindingRules.push(test);
    }
    return bindingRules;
}

interface BetweenStatement{
    localInfo: string,
    remoteInfo: string,
}