import { MountObserver, seed, BeHive } from 'be-hive/be-hive.js';
import { emc as baseEMC } from './behivior.js';
export const emc = {
    ...baseEMC,
    base: '🪢',
    enhPropKey: '🪢',
};
const mose = seed(emc);
MountObserver.synthesize(document, BeHive, mose);
