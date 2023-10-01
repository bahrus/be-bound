import { tryParse } from 'be-enhanced/cpu.js';
import { strType } from './be-bound.js';
const reWithBindingStatement = [
    {
        regExp: new RegExp(String.raw `^(?<remoteType>${strType})(?<remoteProp>[\w]+)`),
        defaultVals: {}
    }
];
// //TODO: move to be-linked
// const enhancementMap: Map<ElTypes, SignalEnhancement> = new Map();
// enhancementMap.set('')
export function prsWith(self) {
    const { With } = self;
    const bindingRules = [];
    ///const defltLocal = getDfltLocal(self);
    for (const withStatement of With) {
        const test = tryParse(withStatement, reWithBindingStatement);
        if (test === null)
            throw 'PE'; //Parse Error
        bindingRules.push(test);
    }
    return bindingRules;
}
