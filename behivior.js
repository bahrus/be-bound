import { register } from 'be-hive/register.js';
import { tagName } from './be-bound.js';
import './be-bound.js';
const ifWantsToBe = 'bound';
const upgrade = '*';
register(ifWantsToBe, upgrade, tagName);
