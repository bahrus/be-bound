import {AP, ProPAP, PAP, BindingRule} from './types';
import {ElTypes} from 'be-linked/types';
import {RegExpOrRegExpExt} from 'be-enhanced/types';
import {arr, tryParse} from 'be-enhanced/cpu.js';

const strType = String.raw `\$|\#|\@|\/|\-`;
const reBindingStatement: Array<RegExpOrRegExpExt<BindingRule>> = [
    {
        regExp: new RegExp(String.raw `^(?<remoteType>${strType})(?<remoteProp>[\w]+)(?<!\\)OnParWith(?<localProp>[\w]+)`),
        defaultVals: {}
    }
];

export function prsTo(self: AP) : PAP {

}