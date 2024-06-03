import {BeBound} from './be-bound.js';
export {BeBound} from './be-bound.js';
import {def} from 'trans-render/lib/def.js';

await BeBound.bootUp();

def('be-bound', BeBound);