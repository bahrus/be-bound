//import {strType} from './be-bound.js';
import { prsElO } from 'trans-render/lib/prs/prsElO.js';
// const reWithBindingStatement: Array<RegExpOrRegExpExt<BindingRule>> = [
//     {
//         regExp: new RegExp(String.raw `^(?<remoteType>${strType})(?<remoteProp>[\w\-]+)`),
//         defaultVals: {
//         }
//     },
//     {
//         regExp: new RegExp(String.raw `^(?<remoteProp>[\w\-]+)`),
//         defaultVals: {
//             remoteType: '/'
//         }
//     }
// ];
// //TODO: move to be-linked
// const enhancementMap: Map<ElTypes, SignalEnhancement> = new Map();
// enhancementMap.set('')
export function prsWith(self) {
    const { With, with: w } = self;
    const both = [...(With || []), ...(w || [])];
    const bindingRules = [];
    for (const withStatement of both) {
        const remoteElO = prsElO(withStatement);
        bindingRules.push({
            remoteElO
        });
        // const test = tryParse(withStatement, reWithBindingStatement) as BindingRule;
        // if(test === null) throw 'PE'; //Parse Error
        // bindingRules.push(test);
    }
    return bindingRules;
}
