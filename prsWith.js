import { tryParse } from 'be-enhanced/cpu.js';
import { strType } from './be-bound.js';
const reWithBindingStatement = [
    {
        regExp: new RegExp(String.raw `^(?<remoteType>${strType})(?<remoteProp>[\w\-]+)`),
        defaultVals: {}
    },
    {
        regExp: new RegExp(String.raw `^(?<remoteProp>[\w\-]+)`),
        defaultVals: {
            remoteType: '/'
        }
    }
];
// //TODO: move to be-linked
// const enhancementMap: Map<ElTypes, SignalEnhancement> = new Map();
// enhancementMap.set('')
export function prsWith(self) {
    const { With, with: w } = self;
    const both = [...(With || []), ...(w || [])];
    const bindingRules = [];
    for (const withStatement of both) {
        const test = tryParse(withStatement, reWithBindingStatement);
        if (test === null)
            throw 'PE'; //Parse Error
        bindingRules.push(test);
    }
    return bindingRules;
}
