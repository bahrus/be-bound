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
        this.init(this);
    }

    async init({host, hostProp, child, childProp, options}: this){
        if(tooSoon(host)){
            await customElements.whenDefined(host.localName);
        }
        if(options === undefined || !options.localValueTrumps){
            if((host as any)[hostProp]){
                this.updateChild();
            }else if((child as any)[childProp]){
                this.updateHost();
            }
        }else{
            if((child as any)[childProp]){
                this.updateHost();
            }else if((host as any)[hostProp]){
                this.updateChild();
            }
        }

    }

    updateHost = () => {
        const currentChildVal = (this.child as any)[this.childProp];
        if(typeof currentChildVal === 'object'){
            if(currentChildVal[childUpdateInProgress]){
                currentChildVal[childUpdateInProgress] = false;
                return;
            }
        }
        const currentHostVal = (this.host  as any)[this.hostProp];
        
        if(currentChildVal === currentHostVal) return;
        if(typeof currentChildVal === 'object'){
            const clone = this.options?.noClone ? currentChildVal : structuredClone(currentChildVal);
            clone[hostUpdateInProgress] = true;
            (this.host as any)[this.hostProp] = clone;
        }else{
            (this.host as any)[this.hostProp] = (this.child as any)[this.childProp];
        }
       
    }

    updateChild = () => {
        const currentHostVal = (this.host  as any)[this.hostProp];
        if(typeof currentHostVal === 'object'){
            if(currentHostVal[hostUpdateInProgress]){
                currentHostVal[hostUpdateInProgress] = false;
                return;
            }
        }
        const currentChildVal = (this.child as any)[this.childProp];
        if(currentChildVal === currentHostVal) return;
        if(typeof currentHostVal === 'object'){
            const clone = this.options?.noClone ? currentHostVal : structuredClone(currentHostVal);
            clone[childUpdateInProgress] = true;
            (this.child as any)[this.childProp] = clone;
        }else{
            (this.child as any)[this.childProp] = currentHostVal;
        }
        
    }
}

export function tooSoon(element: Element){
    return element.localName.includes('-') && customElements.get(element.localName) === undefined;
}

const hostUpdateInProgress = Symbol();
const childUpdateInProgress = Symbol();