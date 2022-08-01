import { subscribe } from 'trans-render/lib/subscribe.js';
export class BoundInstance {
    childProp;
    hostProp;
    child;
    host;
    options;
    constructor(childProp, hostProp, child, host, options) {
        this.childProp = childProp;
        this.hostProp = hostProp;
        this.child = child;
        this.host = host;
        this.options = options;
        if (child.localName === 'input' && childProp === 'value') {
            child.addEventListener('input', this.updateHost);
        }
        else {
            subscribe(child, childProp, this.updateHost);
        }
        subscribe(host, hostProp, this.updateChild);
        if (host[hostProp]) {
            this.updateChild();
        }
        else if (child[childProp]) {
            this.updateHost();
        }
    }
    updateHost = () => {
        console.log('updateHost');
        this.host[this.hostProp] = this.child[this.childProp];
    };
    updateChild = () => {
        console.log('updateChild');
        this.child[this.childProp] = this.host[this.hostProp];
    };
}
