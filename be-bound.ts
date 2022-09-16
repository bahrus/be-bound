import {BeDecoratedProps, define} from 'be-decorated/be-decorated.js';
import {Actions, ProxyProps, VirtualProps, PP} from './types';
import {register} from 'be-hive/register.js';
import {BoundInstance} from './BoundInstance.js';


export class BeBound implements Actions{
    onProps({propBindings, proxy}: PP): void {
        const host = (proxy.getRootNode() as any).host as Element;
        for(const propBinding of propBindings!){
            const [childProp, hostProp, options] = propBinding;
            const bi = new BoundInstance(childProp, hostProp, proxy, host, options);
            
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
