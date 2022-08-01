import {BindingOptions} from './types';
import {subscribe} from 'trans-render/lib/subscribe.js';

export class BoundInstance{
    constructor(public childProp: string, public hostProp: string, child: Element, public host: Element, public options: BindingOptions | undefined){
        subscribe(child, childProp, this.updateHost);
        subscribe(host, hostProp, this.updateChild);
    }

    updateHost = () => {
        console.log('updateHost');
    }

    updateChild = () => {
        console.log('updateChild');
    }
}