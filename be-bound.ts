import {BeDecoratedProps, define} from 'be-decorated/be-decorated.js';
import {BeBoundActions, BeBoundProps, BeBoundVirtualProps} from './types';
import {DefineArgs} from 'trans-render/lib/types';
import {register} from 'be-hive/register.js';

export class BeBound implements BeBoundActions{

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
            virtualProps:[]
        },
        actions:{
        
        }
    },
    complexPropDefaults:{
        controller: BeBound,
    }
});
