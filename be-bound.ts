import {BeDecoratedProps, define} from 'be-decorated/be-decorated.js';
import {BeBoundActions, BeBoundProps, BeBoundVirtualProps} from './types';
import {DefineArgs} from 'trans-render/lib/types';
import {register} from 'be-hive/register.js';
import {BoundInstance} from './BoundInstance.js';


export class BeBound implements BeBoundActions{
    onProps({propBindings, proxy}: this): void {
        const host = (proxy.getRootNode() as any).host as Element;
        for(const propBinding of propBindings){
            const [childProp, hostProp, options] = propBinding;
            const bi = new BoundInstance(childProp, hostProp, proxy, host, options);
            
        }
        
    }
}

export interface BeBound extends BeBoundProps{}

const tagName = 'be-bound';

const ifWantsToBe = 'bound';

export const upgrade = '*';

define<BeBoundProps & BeDecoratedProps<BeBoundProps, BeBoundActions>, BeBoundActions>({
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
