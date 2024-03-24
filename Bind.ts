import { AP, BindingRule } from './types';
import {Seeker} from 'be-linked/Seeker.js';
import {LocalSignal, SignalAndEvent, SignalRefType} from 'be-linked/types';

export class Bind{
    constructor(public bindingRule: BindingRule){}

    
    #remoteSignalAndEvent: SignalAndEvent | undefined;
    #localSignalAndEvent: SignalAndEvent | undefined;
    #localAbortControl = new AbortController();
    #remoteAbortControl = new AbortController();

    async do(self: AP){
        const {enhancedElement} = self;
        const {bindingRule} = this;
        const {remoteElO, localEvent, localProp} = bindingRule;
        const seeker = new Seeker<AP, any>(remoteElO!, false);
        this.#remoteSignalAndEvent = await seeker.do(self, undefined, enhancedElement);
        
        if(localEvent === undefined){
            const {localName} = enhancedElement;
            switch(localName){
                default:
                    await this.#getDfltLocal(self);
                    

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
            localSignal.addEventListener(eventSuggestion, e => {
                this.#reconcileValues(self);
            }, {signal: this.#localAbortControl.signal});
        }
        if(this.#remoteSignalAndEvent === undefined) throw 'NI';
        {
            const {eventSuggestion, signal} = this.#remoteSignalAndEvent;
            const remoteSignal = signal?.deref();
            if(remoteSignal === undefined || eventSuggestion === undefined) return;
            remoteSignal.addEventListener(eventSuggestion, e => {
                this.#reconcileValues;
            }, {signal: this.#remoteAbortControl.signal})
        }
        this.#reconcileValues(self);
    }

    async #getDfltLocal(self: AP){
        const {getLocalSignal} = await import('be-linked/defaults.js');
        const {enhancedElement} = self;
        const localSignal = await getLocalSignal(enhancedElement);
        const {signal: s, type, prop} = localSignal;
        const signal = new WeakRef(s);
        const localProp = localSignal.prop;
        const {localName} = enhancedElement;
        const eventSuggestion = localName === 'input' || enhancedElement.hasAttribute('contenteditable') ? 'input' : undefined,
        this.#localSignalAndEvent = {
            eventSuggestion,
            signal,
            //propagator: 
        };
    }

    async #reconcileValues(self: AP){
        if(this.#localSignalAndEvent === undefined || this.#remoteSignalAndEvent === undefined) return;
        const {} = this.#localSignalAndEvent;
        const {eventSuggestion, signal} = this.#remoteSignalAndEvent;
        const {bindingRule} = this;
        const {remoteElO, localEvent} = bindingRule;
        const {getObsVal} = await import('be-linked/getObsVal.js');
        const remoteSignalRef = signal?.deref();
        if(remoteSignalRef === undefined) throw 404;
        const {enhancedElement} = self;
        const remoteVal = await getObsVal(remoteSignalRef, remoteElO!, enhancedElement);
        console.log({remoteVal});
        // const {localProp, localSignal} = bindingRule;
        // const localSignalDeref = localSignal?.deref() as any;
        // const remoteSignalDeref = remoteSignal?.deref() as any;
        // if(localSignalDeref === undefined) throw 404;
        // if(remoteSignalDeref === undefined) throw 404;
        // const localVal = getSignalVal(localSignalDeref);
        // const remoteVal = getSignalVal(remoteSignalDeref);
        // if(localVal === remoteVal) continue; //TODO:  what if they are objects?
        // let winner = src as string;
        // let tieBrakerVal: any = undefined;
        // if(winner === 'tie'){
        //     const tieBreaker = compareSpecificity(localVal, remoteVal);
        //     winner = tieBreaker.winner!;
        //     //console.log({winner, tieBreaker, localProp, remoteProp, localVal, remoteVal});
        //     if(winner === 'tie') continue;
        //     tieBrakerVal = tieBreaker.val;
            
        // }
        
        // switch(winner){
        //     case 'local':
        //         setSignalVal(remoteSignalDeref, tieBrakerVal || localVal);
        //         break;
        //     case 'remote':
        //         setSignalVal(localSignalDeref, tieBrakerVal || remoteVal);
        //         break;
        // }
    }
}