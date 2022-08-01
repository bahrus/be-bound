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
        this.init(this);
    }
    async init({ host, hostProp, child, childProp }) {
        if (tooSoon(host)) {
            await customElements.whenDefined(host.localName);
        }
        if (host[hostProp]) {
            this.updateChild();
        }
        else if (child[childProp]) {
            this.updateHost();
        }
    }
    updateHost = () => {
        const currentHostVal = this.host[this.hostProp];
        const currentChildVal = this.child[this.childProp];
        if (currentChildVal === currentHostVal)
            return;
        this.host[this.hostProp] = this.child[this.childProp];
    };
    updateChild = () => {
        const currentHostVal = this.host[this.hostProp];
        const currentChildVal = this.child[this.childProp];
        if (currentChildVal === currentHostVal)
            return;
        this.child[this.childProp] = this.host[this.hostProp];
    };
}
export function tooSoon(element) {
    return element.localName.includes('-') && customElements.get(element.localName) === undefined;
}
