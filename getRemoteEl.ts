import {ElTypes} from 'be-linked/types';
import {Scope} from 'trans-render/lib/types';
import {findRealm} from 'trans-render/lib/findRealm.js';

type ScopeOrScopeFn = Scope | ((remoteProp: string) => Scope);
const realmMap = new Map<ElTypes, ScopeOrScopeFn>(
    [
        ['#', (remoteProp: string) => ['wrn', '#' + remoteProp]],
        ['/', 'hostish'],
        ['@', (remoteProp: string) => ['wf', remoteProp]],
        ['$', (remoteProp: string) => ['wis', remoteProp]],
        ['-', (remoteProp: string) => ['us', `[-${remoteProp}]`]]
    ]
);

export async function getRemoteEl(enhancedElement: Element, typ: ElTypes, remoteProp: string)
{
    const scopeOrScopeFn = realmMap.get(typ);
    const scope = (typeof scopeOrScopeFn === 'function' ? scopeOrScopeFn(remoteProp) : scopeOrScopeFn)!;
    const el = await findRealm(enhancedElement, scope) as Element;
    if(!el) throw 404;
    return el;
}