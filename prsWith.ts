import {AP, ProPAP, PAP, BindingRule, SignalEnhancement} from './types';
import {parse} from 'trans-render/dss/parse.js';

export async function prsWith(self: AP) : Promise<Array<BindingRule>> {
    const {With, with: w} = self;
    const both = [...(With || []), ...(w || [])];
    const bindingRules: Array<BindingRule> = [];
    for(const withStatement of both){
        const remoteSpecifier = await parse(withStatement);
        bindingRules.push({
            remoteSpecifier
        });
    }
    return bindingRules;
}