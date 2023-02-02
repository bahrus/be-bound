import {BeDecoratedProps, define} from 'be-decorated/DE.js';
import {Actions, ProxyProps, VirtualProps, PP, BindingTuplet} from './types';
import {register} from 'be-hive/register.js';


export class BeBound implements Actions{
    async onProps({propBindings, proxy, self}: PP) {
        const {getHost} = await import('trans-render/lib/getHost.js');
        const host = getHost(self);
        if(host === null) throw '404';
        const {BoundInstance} = await import('./BoundInstance.js');
        for(const propBindingOrString of propBindings!){
            const propBinding = (typeof propBindingOrString === 'string' ? ['value', propBindingOrString] : propBindingOrString) as BindingTuplet;
            const [childProp, hostProp, options] = propBinding;
            const bi = new BoundInstance(childProp, hostProp, self, host, options);
            
        }
        
    }
}

const tagName = 'be-bound';

const ifWantsToBe = 'bound';

export const upgrade = '*';

define<ProxyProps & BeDecoratedProps<ProxyProps, Actions>, Actions>({
    config:{
        tagName,
        propDefaults:{
            upgrade,
            ifWantsToBe,
            primaryProp: 'propBindings',
            primaryPropReq: true,
            virtualProps:['propBindings']
        },
        actions:{
            onProps: 'propBindings'
        }
    },
    complexPropDefaults:{
        controller: BeBound,
    }
});
register(ifWantsToBe, upgrade, tagName);
