import { parse } from 'trans-render/dss/parse.js';
export async function prsWith(self) {
    const { With, with: w } = self;
    const both = [...(With || []), ...(w || [])];
    const bindingRules = [];
    for (const withStatement of both) {
        const remoteSpecifier = await parse(withStatement);
        bindingRules.push({
            remoteSpecifier
        });
    }
    return bindingRules;
}
