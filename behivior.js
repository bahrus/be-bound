import { BeHive, MountObserver, seed } from 'be-hive/be-hive.js';
const betweenLocalPropAndRemoteSpecifierString = String.raw `^between (?<localProp>[\w\:]+)(?<!\\) and (?<remoteSpecifierString>.*)`;
const withRemoteSpecifierString = String.raw `^with (?<remoteSpecifierString>.*)`;
const rssTors = ['remoteSpecifierString', 'remoteSpecifier'];
const base = 'be-bound';
export const emc = {
    base,
    map: {
        '0.0': {
            instanceOf: 'Object$entences',
            objValMapsTo: '.',
            regExpExts: {
                bindingRules: [
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
        const { BeBound } = await import('./be-bound.js');
        return BeBound;
    }
};
const mose = seed(emc);
MountObserver.synthesize(document, BeHive, mose);
