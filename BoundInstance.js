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
        const self = this;
        switch (localName) {
            case 'input':
            case 'form':
                child.addEventListener('input', e => {
                    this.updateHost(self);
                });
                break;
            default:
                subscribe(child, childProp, () => {
                    self.updateHost(self);
                });
        }
        subscribe(host, hostProp, this.updateChild);
        this.init(this);
    }
    async init(self) {
        const { host, hostProp, child, childProp, options } = self;
        if (tooSoon(host)) {
            await customElements.whenDefined(host.localName);
        }
        if (options === undefined || !options.localValueTrumps) {
            if (host[hostProp]) {
                self.updateChild();
            }
            else if (child[childProp]) {
                await this.updateHost(self);
            }
        }
        else {
            if (child[childProp]) {
                await self.updateHost(self);
            }
            else if (host[hostProp]) {
                await self.updateChild();
            }
        }
    }
    async updateHost(self) {
        const { childProp, child } = self;
        let currentChildVal;
        if (childProp[0] === '.') {
            const { getVal } = await import('trans-render/lib/getVal.js');
            currentChildVal = await getVal({ host: child }, childProp);
        }
        else {
            currentChildVal = child[childProp];
        }
        if (typeof currentChildVal === 'object') {
            if (currentChildVal[childUpdateInProgressKey]) {
                currentChildVal[childUpdateInProgressKey] = false;
                return;
            }
        }
        const { host } = self;
        const currentHostVal = host[this.hostProp];
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
            this.host[this.hostProp] = currentChildVal;
        }
    }
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
