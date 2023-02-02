import {BindingOptions, HostSubscriptionStatus, HostSubscriptionMap} from './types';
import {subscribe} from 'trans-render/lib/subscribe.js';

export class BoundInstance{

    #guid!: string;

    constructor(public childProp: string, public hostProp: string, public child: Element, public host: EventTarget, public options: BindingOptions | undefined){
        this.#guid = crypto.randomUUID();
        const {localName} = child;
        const self = this;
        switch(localName){
            case 'input':
            case 'form':
                child.addEventListener('input', e => {
                    this.updateHost(self)
                });
                break;
            default:
                subscribe(child, childProp, () => {
                    self.updateHost(self);
                } );
        }
        subscribe(host, hostProp, () => {
            self.updateChild(self);
        });
        this.init(this);
    }

    async init(self: this){
        const {host, hostProp, child, childProp, options} = self;
        if(tooSoon(host)){
            await customElements.whenDefined((host as Element).localName);
        }
        if(options === undefined || !options.localValueTrumps){
            if((host as any)[hostProp]){
                await self.updateChild(self);
            }else if((child as any)[childProp]){
                await this.updateHost(self);
            }
        }else{
            if((child as any)[childProp]){
                await self.updateHost(self);
            }else if((host as any)[hostProp]){
                await self.updateChild(self);
            }
        }

    }

    async updateHost(self: this){
        const {childProp, child} = self;
        let currentChildVal: any;
        if(childProp[0] === '.'){
            const {getVal} = await import('trans-render/lib/getVal.js');
            currentChildVal = await getVal({host: child}, childProp);
        }else{
            currentChildVal =  (child as any)[childProp];
        }
        
        if(typeof currentChildVal === 'object'){
            if(currentChildVal[childUpdateInProgressKey]){
                currentChildVal[childUpdateInProgressKey] = false;
                return;
            }
        }
        const {host} = self;
        const currentHostVal = (host  as any)[this.hostProp];
        
        if(currentChildVal === currentHostVal) return;
        if(typeof currentChildVal === 'object'){
            const clone = this.options?.noClone ? currentChildVal : structuredClone(currentChildVal);
            let updateSubscriptions = clone[hostUpdateInProgressKey] as HostSubscriptionMap | undefined;
            if(updateSubscriptions === undefined){
                updateSubscriptions = {};
                clone[hostUpdateInProgressKey] = updateSubscriptions;
            }
            clone[hostUpdateInProgressKey] = true;
            (this.host as any)[this.hostProp] = clone;
        }else{
            (this.host as any)[this.hostProp] = currentChildVal;
        }
       
    }

    async updateChild(self: this){
        const {host, hostProp} = self;
        const currentHostVal = (host  as any)[hostProp];
        if(typeof currentHostVal === 'object'){
            const updateSubscriptions = currentHostVal[hostUpdateInProgressKey];
            if(updateSubscriptions){
                const localSubscription = updateSubscriptions[self.#guid] as HostSubscriptionStatus;
                if(localSubscription !== undefined && localSubscription.inProgress){
                    localSubscription.inProgress = false;
                    return;
                }
            }
        }
        const {child, childProp, options} = self;
        let currentChildVal: any;
        if(childProp[0] === '.'){
            const {getVal} = await import('trans-render/lib/getVal.js');
            currentChildVal = await getVal({host: child}, childProp);
        }else{
            currentChildVal =  (child as any)[childProp];
        }
        if(currentChildVal === currentHostVal) return;
        let newVal: any;
        if(typeof currentHostVal === 'object'){
            const clone = options?.noClone ? currentHostVal : structuredClone(currentHostVal);
            clone[childUpdateInProgressKey] = true;
            newVal = clone;
        }else{
            newVal = currentHostVal;
        }
        if(childProp[0] === '.'){
            const {setProp} = await import('trans-render/lib/setProp.js');
            setProp(child, childProp, newVal);
        }else{
            (child as any)[childProp] = newVal;
        }
        
    }
}

export function tooSoon(element: EventTarget){
    if(!(element instanceof Element)) return false;
    return element.localName.includes('-') && customElements.get(element.localName) === undefined;
}

const hostUpdateInProgressKey = 'cAof77nfME6DYaPacjXvbA==';
const childUpdateInProgressKey = Symbol();

