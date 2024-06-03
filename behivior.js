import { BeHive } from 'be-hive/be-hive.js';
import { MountObserver } from 'mount-observer/MountObserver.js';
const base = 'be-bound';
export const emc = {
    base,
    map: {
        '0.0': 'eventName'
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
