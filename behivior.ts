import {BeHive, EMC} from 'be-hive/be-hive.js';
import {MountObserver, MOSE} from 'mount-observer/MountObserver.js';

const betweenLocalPropAndRemoteProp = String.raw `^between (?<localProp>[\w\:]+)(?<!\\) and (?<remoteSpecifierString>.*)`;
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
                        regExp: betweenLocalPropAndRemoteProp,
                        defaultVals: {},
                        dssKeys: [['remoteSpecifierString', 'remoteSpecifier']]
                    },
                ]
            }
        }
    },
    enhPropKey: 'beBound',
    importEnh: async () => {
        const {BeBound} = await import('./behance.js');
        return BeBound;
    }
};

const mose = document.createElement('script') as MOSE<EMC>;
mose.id = base;
mose.synConfig = emc;

MountObserver.synthesize(document, BeHive, mose);



