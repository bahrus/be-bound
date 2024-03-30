import {AP, ProPAP, PAP, BindingRule, SignalEnhancement} from './types';
import {ElTypes} from 'be-linked/types';
import {RegExpOrRegExpExt} from 'be-enhanced/types';
import {arr} from 'trans-render/lib/arr.js';
import {tryParse} from 'trans-render/lib/prs/tryParse.js'
import {parse} from 'trans-render/dss/parse.js';

const reBetweenBindingStatement: Array<RegExpOrRegExpExt<BetweenStatement>> = [
    {
        regExp: new RegExp(String.raw `^(?<localInfo>[\w\:]+)(?<!\\)And(?<remoteInfo>.*)`),
        defaultVals: {}
    }
];

export async function prsBetween(self: AP) : Promise<Array<BindingRule>>{
    const {Between, between} = self;
    const both = [...(Between || []), ...(between || [])];
    const bindingRules: Array<BindingRule> = [];
    for(const betweenStatement of both){
        const test = tryParse(betweenStatement, reBetweenBindingStatement) as BetweenStatement;
        if(test === null) throw 'PE';  //Parse Error
        const {localInfo, remoteInfo} = test;
        const propEvent = localInfo.split('::');
        const [rawLocalProp, localEvent] = propEvent;
        //const localEvent = propEvent.length > 1 ? propEvent[1] : undefined;
        const localProp = rawLocalProp.includes(':') ? '.' + propEvent[0].replaceAll(':', '.') : rawLocalProp;
        const remoteSpecifier = await parse(remoteInfo);
        bindingRules.push({
            localEvent,
            localProp,
            remoteSpecifier
        });
        //bindingRules.push(test);
    }
    return bindingRules;
}

interface BetweenStatement{
    localInfo: string,
    remoteInfo: string,
}