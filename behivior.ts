import {BeHive, EMC, MountObserver, seed} from 'be-hive/be-hive.js';

const betweenLocalProp = String.raw `^between (?<localProp>[\w\:]+)`;
const betweenLocalPropLocalEvent = String.raw `${betweenLocalProp}\:\:(?<localEvent>[\w]+)`;
const andRemoteSpecifierString = String.raw `(?<!\\) and (?<remoteSpecifierString>.*)`
const betweenLocalPropAndRemoteSpecifierString = String.raw `${betweenLocalProp}${andRemoteSpecifierString}`;
const betweenLocalPropLocalEventAndRemoteSpecifierString = String.raw `${betweenLocalPropLocalEvent}${andRemoteSpecifierString}`;
const withRemoteSpecifierString = String.raw `^with (?<remoteSpecifierString>.*)`;
const rssTors: [string, string] = ['remoteSpecifierString', 'remoteSpecifier'];
const base = 'be-bound';
export const emc: EMC = {
    base,
    map: {
        '0.0': {
            instanceOf: 'Object$entences',
            objValMapsTo: '.',
            regExpExts: {
                bindingRules: [
                    {
                        regExp: betweenLocalPropLocalEventAndRemoteSpecifierString,
                        defaultVals: {},
                        dssKeys: [rssTors]
                    },
                    {
                        regExp: betweenLocalPropAndRemoteSpecifierString,
                        defaultVals: {},
                        dssKeys: [rssTors]
                    },
                    {
                        regExp: withRemoteSpecifierString,
                        defaultVals: {},
                        dssKeys: [rssTors]
                    }
                ]
            }
        }
    },
    enhPropKey: 'beBound',
    importEnh: async () => {
        const {BeBound} = await import('./be-bound.js');
        return BeBound;
    }
};

const mose = seed(emc);

MountObserver.synthesize(document, BeHive, mose);



