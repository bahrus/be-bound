//@ts-check

/** @import {EMC} from './types/mount-observer/types' */;
/** @import {AllProps, Actions} from './types/be-bound/types' */
/** @import {RAConfig} from './types/roundabout/types' */
/** @import {PatternConfig} from './types/nested-regex-groups/types' */

const betweenLocalProp = String.raw `^between (?<localProp>[\w\:]+)`;
const betweenLocalPropLocalEvent = String.raw `${betweenLocalProp}\:\:(?<localEvent>[\w]+)`;
const andRemoteSpecifierString = String.raw `(?<!\\) and (?<remoteSpecifierString>.*)`;
const betweenLocalPropAndRemoteSpecifierString = String.raw `${betweenLocalProp}${andRemoteSpecifierString}`;
const betweenLocalPropLocalEventAndRemoteSpecifierString = String.raw `${betweenLocalPropLocalEvent}${andRemoteSpecifierString}`;
const withRemoteSpecifierString = String.raw `^with (?<remoteSpecifierString>.*)`;

/** @type {PatternConfig[]} */
const parsePatterns = [
    {
        name: 'betweenLocalPropLocalEventAndRemoteSpecifierString',
        pattern: betweenLocalPropLocalEventAndRemoteSpecifierString,
        description: 'Between local property with event and remote specifier: between prop::event and remote',
        defaultVals: {}
    },
    {
        name: 'betweenLocalPropAndRemoteSpecifierString',
        pattern: betweenLocalPropAndRemoteSpecifierString,
        description: 'Between local property and remote specifier: between prop and remote',
        defaultVals: {}
    },
    {
        name: 'withRemoteSpecifierString',
        pattern: withRemoteSpecifierString,
        description: 'With remote specifier: with remote',
        defaultVals: {}
    }
];

/**
 * @type {EMC<any, AllProps, Element, RAConfig<AllProps, Actions> >}
 */
export const emc = {
    enhConfig: {
        enhKey: 'BeBound',
        spawn: 'be-bound/be-bound.js',
        withAttrs: {
            base: 'be-bound',
            _base: {
                mapsTo: 'bindingRules',
                parser: 'parse-grouped-capture-statements',
                instanceOf: 'Array',
                parserConfig: parsePatterns
            }
        }
    },
    customData: {
        weakRef: {
            properties: ['enhancedElement']
        },
        actions: {
            noAttrs: {
                ifNoneOf: ['bindingRules', 'enhancedElement'],
            }
        },
        compacts: {
            when_bindingRules_changes_call_getBindings: 0,
            when_bindings_changes_call_hydrate: 0,
        }
    }
}

export function render(){
    return JSON.stringify(emc, null, 4);
}

console.log(render());
