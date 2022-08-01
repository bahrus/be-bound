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
    async init({ host, hostProp, child, childProp, options }) {
        if (tooSoon(host)) {
            await customElements.whenDefined(host.localName);
        }
        if (options === undefined || !options.localValueTrumps) {
            if (host[hostProp]) {
                this.updateChild();
            }
            else if (child[childProp]) {
                this.updateHost();
            }
        }
        else {
            if (child[childProp]) {
                this.updateHost();
            }
            else if (host[hostProp]) {
                this.updateChild();
            }
        }
    }
    updateHost = () => {
        const currentChildVal = this.child[this.childProp];
        if (typeof currentChildVal === 'object') {
            if (currentChildVal[childUpdateInProgress]) {
                currentChildVal[childUpdateInProgress] = false;
                return;
            }
        }
        const currentHostVal = this.host[this.hostProp];
        if (currentChildVal === currentHostVal)
            return;
        if (typeof currentChildVal === 'object') {
            const clone = this.options?.noClone ? currentChildVal : structuredClone(currentChildVal);
            clone[hostUpdateInProgress] = true;
            this.host[this.hostProp] = clone;
        }
        else {
            this.host[this.hostProp] = this.child[this.childProp];
        }
    };
    updateChild = () => {
        const currentHostVal = this.host[this.hostProp];
        if (typeof currentHostVal === 'object') {
            if (currentHostVal[hostUpdateInProgress]) {
                currentHostVal[hostUpdateInProgress] = false;
                return;
            }
        }
        const currentChildVal = this.child[this.childProp];
        if (currentChildVal === currentHostVal)
            return;
        if (typeof currentHostVal === 'object') {
            const clone = this.options?.noClone ? currentHostVal : structuredClone(currentHostVal);
            clone[childUpdateInProgress] = true;
            this.child[this.childProp] = clone;
        }
        else {
            this.child[this.childProp] = currentHostVal;
        }
    };
}
export function tooSoon(element) {
    return element.localName.includes('-') && customElements.get(element.localName) === undefined;
}
const hostUpdateInProgress = Symbol();
const childUpdateInProgress = Symbol();
