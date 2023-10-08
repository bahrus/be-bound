import { tryParse } from 'be-enhanced/cpu.js';
import { strType } from './be-bound.js';
const reBetweenBindingStatement = [
    {
        regExp: new RegExp(String.raw `^(?<localProp>[\w]+)(?<!\\)And(?<remoteType>${strType})(?<remoteProp>[\w\-]+)`),
        defaultVals: {}
    }
];
export function prsBetween(self) {
    const { Between, between } = self;
    const both = [...(Between || []), ...(between || [])];
    const bindingRules = [];
    for (const betweenStatement of both) {
        const test = tryParse(betweenStatement, reBetweenBindingStatement);
        if (test === null)
            throw 'PE'; //Parse Error
        bindingRules.push(test);
    }
    return bindingRules;
}
