import { subscribe } from 'trans-render/lib/subscribe.js';
export class BoundInstance {
    childProp;
    hostProp;
    host;
    options;
    constructor(childProp, hostProp, child, host, options) {
        this.childProp = childProp;
        this.hostProp = hostProp;
        this.host = host;
        this.options = options;
        subscribe(child, childProp, this.updateHost);
        subscribe(host, hostProp, this.updateChild);
    }
    updateHost = () => {
        console.log('updateHost');
    };
    updateChild = () => {
        console.log('updateChild');
    };
}
