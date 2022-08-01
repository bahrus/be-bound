import {BindingOptions} from './types';
import {subscribe} from 'trans-render/lib/subscribe.js';

export class BoundInstance{
    constructor(public childProp: string, public hostProp: string, public child: Element, public host: Element, public options: BindingOptions | undefined){
        
        if(child.localName === 'input' && childProp === 'value'){
            child.addEventListener('input', this.updateHost);
        }else{
            subscribe(child, childProp, this.updateHost);
        }
            
        subscribe(host, hostProp, this.updateChild);
    }

    updateHost = () => {
        console.log('updateHost');
        (this.host  as any)[this.hostProp] = (this.child as any)[this.childProp];
    }

    updateChild = () => {
        console.log('updateChild');
        (this.child as any)[this.childProp] = (this.host as any)[this.hostProp];
    }
}