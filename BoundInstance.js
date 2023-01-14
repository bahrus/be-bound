import { subscribe } from 'trans-render/lib/subscribe.js';
export class BoundInstance {
    childProp;
    hostProp;
    child;
    host;
    options;
    #guid;
    constructor(childProp, hostProp, child, host, options) {
        this.childProp = childProp;
        this.hostProp = hostProp;
        this.child = child;
        this.host = host;
        this.options = options;
        this.#guid = crypto.randomUUID();
        const { localName } = child;
        switch (localName) {
            case 'input':
            case 'form':
                child.addEventListener('input', this.updateHost);
                break;
            default:
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
            if (currentChildVal[childUpdateInProgressKey]) {
                currentChildVal[childUpdateInProgressKey] = false;
                return;
            }
        }
        const currentHostVal = this.host[this.hostProp];
        if (currentChildVal === currentHostVal)
            return;
        if (typeof currentChildVal === 'object') {
            const clone = this.options?.noClone ? currentChildVal : structuredClone(currentChildVal);
            let updateSubscriptions = clone[hostUpdateInProgressKey];
            if (updateSubscriptions === undefined) {
                updateSubscriptions = {};
                clone[hostUpdateInProgressKey] = updateSubscriptions;
            }
            clone[hostUpdateInProgressKey] = true;
            this.host[this.hostProp] = clone;
        }
        else {
            this.host[this.hostProp] = this.child[this.childProp];
        }
    };
    updateChild = () => {
        const currentHostVal = this.host[this.hostProp];
        if (typeof currentHostVal === 'object') {
            const updateSubscriptions = currentHostVal[hostUpdateInProgressKey];
            if (updateSubscriptions) {
                const localSubscription = updateSubscriptions[this.#guid];
                if (localSubscription !== undefined && localSubscription.inProgress) {
                    localSubscription.inProgress = false;
                    return;
                }
            }
        }
        const currentChildVal = this.child[this.childProp];
        if (currentChildVal === currentHostVal)
            return;
        if (typeof currentHostVal === 'object') {
            const clone = this.options?.noClone ? currentHostVal : structuredClone(currentHostVal);
            clone[childUpdateInProgressKey] = true;
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
const hostUpdateInProgressKey = 'cAof77nfME6DYaPacjXvbA==';
const childUpdateInProgressKey = Symbol();
