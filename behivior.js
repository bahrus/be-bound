import { BeHive } from 'be-hive/be-hive.js';
import { MountObserver } from 'mount-observer/MountObserver.js';
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
        const { BeBound } = await import('./behance.js');
        return BeBound;
    }
};
const mose = document.createElement('script');
mose.id = base;
mose.synConfig = emc;
MountObserver.synthesize(document, BeHive, mose);
