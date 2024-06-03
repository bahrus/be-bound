import {register} from 'be-hive/register.js';
import {tagName } from './legacy/be-bound.js';
import './legacy/be-bound.js';

const ifWantsToBe = 'bound';
const upgrade = '*';

register(ifWantsToBe, upgrade, tagName);