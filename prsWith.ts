import {AP, ProPAP, PAP, BindingRule, SignalEnhancement} from './types';
import {ElTypes} from 'be-linked/types';
import {RegExpOrRegExpExt} from 'be-enhanced/types';
import {arr, tryParse} from 'be-enhanced/cpu.js';
import {prsElO} from 'trans-render/lib/prs/prsElO.js';

export function prsWith(self: AP) : Array<BindingRule> {
    const {With, with: w} = self;
    const both = [...(With || []), ...(w || [])];
    const bindingRules: Array<BindingRule> = [];
    for(const withStatement of both){
        const remoteElO = prsElO(withStatement);
        bindingRules.push({
            remoteElO
        });
    }
    return bindingRules;
}