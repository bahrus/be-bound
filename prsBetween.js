import { tryParse } from 'be-enhanced/cpu.js';
import { prsElO } from 'trans-render/lib/prs/prsElO.js';
const reBetweenBindingStatement = [
    {
        regExp: new RegExp(String.raw `^(?<localInfo>[\w\:]+)(?<!\\)And(?<remoteInfo>.*)`),
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
        const { localInfo, remoteInfo } = test;
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
