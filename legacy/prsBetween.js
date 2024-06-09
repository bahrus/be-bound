import { tryParse } from 'trans-render/lib/prs/tryParse.js';
import { parse } from 'trans-render/dss/parse.js';
const reBetweenBindingStatement = [
    {
        regExp: new RegExp(String.raw `^(?<localInfo>[\w\:]+)(?<!\\)And(?<remoteInfo>.*)`),
        defaultVals: {}
    }
];
export async function prsBetween(self) {
    const { Between, between } = self;
    const both = [...(Between || []), ...(between || [])];
    const bindingRules = [];
    for (const betweenStatement of both) {
        const test = tryParse(betweenStatement, reBetweenBindingStatement);
        if (test === null)
            throw 'PE'; //Parse Error
        const { localInfo, remoteInfo } = test;
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
