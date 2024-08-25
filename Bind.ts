import { AP, BindingRule } from './types';
import {Seeker} from 'be-linked/Seeker.js';
import {LocalSignal, SignalAndEvent, SignalRefType, TriggerSource} from 'be-linked/types';
import {breakTie} from 'be-linked/breakTie.js'; //TODO:  load this on demand without breaking tests
import { Specifier } from './ts-refs/trans-render/dss/types';
import { BEAllProps } from '../be-enhanced/ts-refs/be-enhanced/types';

export class Bind{
    constructor(public bindingRule: BindingRule){}

    
    #remoteSignalAndEvent: SignalAndEvent | undefined;
    #localSignalAndEvent: SignalAndEvent | undefined;
    #localAbortControl = new AbortController();
    #remoteAbortControl = new AbortController();

    async do(self: AP & BEAllProps){
        const {enhancedElement} = self;
        const {bindingRule} = this;
        const {remoteSpecifier, localEvent, localProp} = bindingRule;
        const seeker = new Seeker<AP, any>(remoteSpecifier!, false);
        this.#remoteSignalAndEvent = await seeker.do(self, undefined, enhancedElement);
        
        if(localEvent === undefined){
            const {localName} = enhancedElement;
            if(localName.includes('-')){
                //for now, "cheat" and assume it is an xtal-element
                const propagator = (<any>enhancedElement).xtalState;
                this.#localSignalAndEvent = {
                    eventSuggestion: localProp,
                    signal: new WeakRef(enhancedElement),
                    propagator
                }
            }else{
                switch(localName){
                    default:
                        await this.#getDfltLocal(self);
                }
            }

        }else{
            const {getLocalSignal} = await import('be-linked/defaults.js');
            const signalInfo = await getLocalSignal(enhancedElement);
            const {signal, prop, type} = signalInfo;
            this.#localSignalAndEvent = {
                eventSuggestion: localEvent,
                signal: new WeakRef(signal),
                
            }
        }
        
        if(this.#localSignalAndEvent === undefined) throw 'NI';
        {
            const {eventSuggestion, signal} = this.#localSignalAndEvent;
            const localSignal = signal?.deref();
            if(localSignal === undefined || eventSuggestion === undefined) return;
            localSignal.addEventListener(eventSuggestion, (e: Event) => {
                this.#reconcileValues(self, 'local');
            }, {signal: this.#localAbortControl.signal});
        }
        if(this.#remoteSignalAndEvent === undefined) throw 'NI';
        {
            const {eventSuggestion, signal, propagator} = this.#remoteSignalAndEvent;
            //const remoteSignal = signal?.deref();
            if(eventSuggestion === undefined) throw 'NI';
            (propagator || signal?.deref())?.addEventListener(eventSuggestion, (e: Event) => {
                this.#reconcileValues(self, 'remote');
            }, {signal: this.#remoteAbortControl.signal})
        }
        this.#reconcileValues(self, 'tie');
    }

    async #getDfltLocal(self: AP & BEAllProps){
        const {getLocalSignal} = await import('be-linked/defaults.js');
        const {enhancedElement} = self;
        const localSignal = await getLocalSignal(enhancedElement);
        const {signal: s, type, prop} = localSignal;
        const signal = new WeakRef(s);
        const localProp = localSignal.prop;
        const {localName} = enhancedElement;
        const eventSuggestion =  type || localName === 'input' || enhancedElement.hasAttribute('contenteditable') ? 'input' : type;
        this.#localSignalAndEvent = {
            eventSuggestion,
            signal,
            //propagator: 
        };
    }

    async #reconcileValues(self: AP & BEAllProps, source: TriggerSource){
        if(this.#localSignalAndEvent === undefined || this.#remoteSignalAndEvent === undefined) return;
        const {signal: localSignal} = this.#localSignalAndEvent;
        const {eventSuggestion, signal} = this.#remoteSignalAndEvent;
        const {bindingRule} = this;
        const {remoteSpecifier, localEvent, localProp} = bindingRule;
        const {getObsVal} = await import('be-linked/getObsVal.js');
        const remoteSignalRef = signal?.deref();
        if(remoteSignalRef === undefined) throw 404;
        const {enhancedElement} = self;
        const remoteVal = await getObsVal(remoteSignalRef, remoteSpecifier!, enhancedElement);
        const {getSignalVal} = await import('be-linked/getSignalVal.js');
        const {setSignalVal} = await import('be-linked/setSignalVal.js');
        const localSignalRef = localSignal?.deref()!;
        let localVal: any;
        if(localProp !== undefined){
            if(localProp[0] === '.'){
                const {getVal} = await import('trans-render/lib/getVal.js');
                localVal = await getVal({host: localSignalRef}, localProp);
            }else{
                localVal = (<any>localSignalRef)[localProp];
            }
        }else{
            localVal = getSignalVal(localSignalRef);
        }
        //const localVal = localProp !== undefined ? (<any>localSignalRef)[localProp] : getSignalVal(localSignalRef);
        //console.log({remoteVal, localVal});
        if(localVal === remoteVal) return; //TODO:  what if they are objects?
        switch(source){
            case 'tie':
                {
                    const tieBreaker = compareSpecificity(localVal, remoteVal);
                    const {winner, val} = tieBreaker;
                    switch(winner){
                        case 'local':
                            setSignalVal(remoteSignalRef, val || localVal);
                            break;
                        case 'remote':
                            if(localProp !== undefined){
                                (<any>localSignalRef)[localProp] = val || remoteVal;
                            }else{
                                setSignalVal(localSignalRef, val || remoteVal);
                            }
                            
                            break;
                    }
                }
                break;
            case 'local':{
                setObsVal(remoteSignalRef, remoteSpecifier!, localVal);
                break;
            }
            case 'remote': {
                if(localProp !== undefined){
                    if(localProp[0] === '.'){
                        //TODO support enhancement?
                        const {setProp} = await import('trans-render/lib/setProp.js');
                        setProp(localSignalRef, localProp, remoteVal);
                    }else{
                        (<any>localSignalRef)[localProp] = remoteVal;
                    }
                    
                }else{
                    setSignalVal(localSignalRef, remoteVal);
                }

                break;
            }
        }

    }
}

function compareSpecificity(localVal: any, remoteVal: any) {
    if(localVal === remoteVal) return {
        winner: 'tie',
        val: localVal
    };
    //const {breakTie} = await import('./breakTie.js');
    return breakTie(localVal, remoteVal);

     
}
//TODO: move to be-linked
export async function setObsVal(ref: SignalRefType, specifier: Specifier, val: any){
    const {prop, s} = specifier;
    //the name "prop" is a bit confusing here -- it used as a locator, e.g. itemprop
    //but when it comes to setting the value, that's not always what we need to use.
    switch(s){
        case '#':
        case '@':
            //form associated element, so primary prop is the "value"
            (ref as HTMLInputElement).value = val;
            break;
        case '|':
            if((ref as HTMLElement).contentEditable === 'true'){
                (ref as HTMLInputElement).textContent = val;
            }else if('value' in ref){
                ref.value = val;
            }else{
                throw 'NI';
            }
            break;
        default:
            (<any>ref)[prop!] = val;
    } 
    
}