import { strType } from './be-bound.js';
const reBetweenBindingStatement = [
    {
        regExp: new RegExp(String.raw `^(?<localProp>[\w]+)(?<!\\)And(?<remoteType>${strType})(?<remoteProp>[\w]+)`),
        defaultVals: {}
    }
];
export function prsBetween(self) {
    const { Between } = self;
    const bindingRules = [];
    return bindingRules;
}
