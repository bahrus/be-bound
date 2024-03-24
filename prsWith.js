import { prsElO } from 'trans-render/lib/prs/prsElO.js';
export function prsWith(self) {
    const { With, with: w } = self;
    const both = [...(With || []), ...(w || [])];
    const bindingRules = [];
    for (const withStatement of both) {
        const remoteElO = prsElO(withStatement);
        bindingRules.push({
            remoteElO
        });
    }
    return bindingRules;
}
