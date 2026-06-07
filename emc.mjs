//@ts-check

/** @import {EMC} from './types/mount-observer/types' */;
/** @import {AllProps, Actions} from './types/be-bound/types' */
/** @import {RAConfig} from './types/roundabout/types' */
/** @import {PatternConfig} from './types/nested-regex-groups/types' */

const betweenLocalProp = String.raw `^between (?<localProp>[\w\:]+)`;
const betweenLocalPropLocalEvent = String.raw `${betweenLocalProp}\:\:(?<localEvent>[\w]+)`;
const andRemoteId = String.raw `(?<!\\) and (?<remoteId>.*)`;
const betweenLocalPropAndRemoteId = String.raw `${betweenLocalProp}${andRemoteId}`;
const betweenLocalPropLocalEventAndRemoteId = String.raw `${betweenLocalPropLocalEvent}${andRemoteId}`;
const withRemoteId = String.raw `^with (?<remoteId>.*)`;

/** @type {PatternConfig[]} */
const parsePatterns = [
    {
        name: 'betweenLocalPropLocalEventAndRemoteId',
        pattern: betweenLocalPropLocalEventAndRemoteId,
        description: 'Between local property with event and remote specifier: between prop::event and remote',
        defaultVals: {}
    },
    {
        name: 'betweenLocalPropAndRemoteId',
        pattern: betweenLocalPropAndRemoteId,
        description: 'Between local property and remote specifier: between prop and remote',
        defaultVals: {}
    },
    {
        name: 'withRemoteId',
        pattern: withRemoteId,
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
            // noAttrs: {
            //     ifAllOf: ['enhancedElement'],
            //     ifNoneOf: ['bindingRules'],
            // },
            hydrate: {
                ifAllOf: ['bindingRules', 'enhancedElement']
            }
        },
        // compacts: {
        //     //when_bindingRules_changes_call_getBindings: 0,
        //     when_bindingRules_changes_call_hydrate: 0,
        // }
    }
}

export function render(){
    return JSON.stringify(emc, null, 4);
}

console.log(render());
