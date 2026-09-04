//@ts-check

/** @import {EMC} from './types/mount-observer/types' */;
/** @import {AllProps, Actions} from './types/be-bound/types' */
/** @import {RAConfig} from './types/roundabout/types' */
/** @import {PatternConfig} from './types/nested-regex-groups/types' */

/** @type {PatternConfig[]} */
const parsePatterns = [
    {
        name: 'betweenPathEventAndRemoteId',
        pattern: String.raw`^between (?<localProp>\?\.[\w\?\.]+)@(?<localEvent>[\w]+) and #(?<remoteId>\S+)`,
        description: 'Between path-based local property with event and remote by ID: between ?.path?.prop@event and #id',
        defaultVals: {}
    },
    {
        name: 'betweenPathEventAndRemoteProp',
        pattern: String.raw`^between (?<localProp>\?\.[\w\?\.]+)@(?<localEvent>[\w]+) and (?<remoteProp>[\w\.]+)`,
        description: 'Between path-based local property with event and remote property: between ?.path?.prop@event and prop',
        defaultVals: {}
    },
    {
        name: 'betweenLocalPropEventAndRemoteId',
        pattern: String.raw`^between (?<localProp>[\w]+)@(?<localEvent>[\w]+) and #(?<remoteId>\S+)`,
        description: 'Between local property with event and remote by ID: between prop@event and #id',
        defaultVals: {}
    },
    {
        name: 'betweenLocalPropEventAndRemoteProp',
        pattern: String.raw`^between (?<localProp>[\w]+)@(?<localEvent>[\w]+) and (?<remoteProp>[\w\.]+)`,
        description: 'Between local property with event and remote property: between prop@event and prop',
        defaultVals: {}
    },
    {
        name: 'betweenLocalPropAndRemoteId',
        pattern: String.raw`^between (?<localProp>[\w]+) and #(?<remoteId>\S+)`,
        description: 'Between local property and remote by ID: between prop and #id',
        defaultVals: {}
    },
    {
        name: 'betweenLocalPropAndRemoteProp',
        pattern: String.raw`^between (?<localProp>[\w]+) and (?<remoteProp>[\w\.]+)`,
        description: 'Between local property and remote property: between prop and prop',
        defaultVals: {}
    },
    {
        name: 'withRemoteIdAndEvent',
        pattern: String.raw`^with #(?<remoteId>[\w]+)@(?<remoteEvent>[\w]+)`,
        description: 'With remote element by ID and explicit event: with #elementId@event',
        defaultVals: {}
    },
    {
        name: 'withRemotePropAndEvent',
        pattern: String.raw`^with (?<remoteProp>[\w\.]+)@(?<remoteEvent>[\w]+)`,
        description: 'With remote property and explicit event: with propName@event',
        defaultVals: {}
    },
    {
        name: 'withRemoteId',
        pattern: String.raw`^with #(?<remoteId>\S+)`,
        description: 'With remote element by ID: with #elementId',
        defaultVals: {}
    },
    {
        name: 'withRemoteProp',
        pattern: String.raw`^with (?<remoteProp>[\w\.]+)`,
        description: 'With remote property on host: with propName',
        defaultVals: {}
    }
];

/**
 * @type {EMC<any, AllProps, Element, RAConfig<AllProps, Actions> >}
 */
export const emc = {
    enhConfig: {
        enhKey: 'beBound',
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
            hydrate: {
                ifAllOf: ['bindingRules', 'enhancedElement']
            }
        }
    }
}

export function render(){
    return JSON.stringify(emc, null, 4);
}

console.log(render());
