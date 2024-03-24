import { Seeker } from 'be-linked/Seeker.js';
import { breakTie } from 'be-linked/breakTie.js'; //TODO:  load this on demand without breaking tests
export class Bind {
    bindingRule;
    constructor(bindingRule) {
        this.bindingRule = bindingRule;
    }
    #remoteSignalAndEvent;
    #localSignalAndEvent;
    #localAbortControl = new AbortController();
    #remoteAbortControl = new AbortController();
    async do(self) {
        const { enhancedElement } = self;
        const { bindingRule } = this;
        const { remoteElO, localEvent, localProp } = bindingRule;
        const seeker = new Seeker(remoteElO, false);
        this.#remoteSignalAndEvent = await seeker.do(self, undefined, enhancedElement);
        if (localEvent === undefined) {
            const { localName } = enhancedElement;
            switch (localName) {
                default:
                    await this.#getDfltLocal(self);
            }
        }
        else {
            const { getLocalSignal } = await import('be-linked/defaults.js');
            const signalInfo = await getLocalSignal(enhancedElement);
            const { signal, prop, type } = signalInfo;
            this.#localSignalAndEvent = {
                eventSuggestion: localEvent,
                signal: new WeakRef(signal),
            };
        }
        if (this.#localSignalAndEvent === undefined)
            throw 'NI';
        {
            const { eventSuggestion, signal } = this.#localSignalAndEvent;
            const localSignal = signal?.deref();
            if (localSignal === undefined || eventSuggestion === undefined)
                return;
            localSignal.addEventListener(eventSuggestion, e => {
                this.#reconcileValues(self, 'local');
            }, { signal: this.#localAbortControl.signal });
        }
        if (this.#remoteSignalAndEvent === undefined)
            throw 'NI';
        {
            const { eventSuggestion, signal, propagator } = this.#remoteSignalAndEvent;
            //const remoteSignal = signal?.deref();
            if (eventSuggestion === undefined)
                throw 'NI';
            (propagator || signal?.deref())?.addEventListener(eventSuggestion, e => {
                this.#reconcileValues(self, 'remote');
            }, { signal: this.#remoteAbortControl.signal });
        }
        this.#reconcileValues(self, 'tie');
    }
    async #getDfltLocal(self) {
        const { getLocalSignal } = await import('be-linked/defaults.js');
        const { enhancedElement } = self;
        const localSignal = await getLocalSignal(enhancedElement);
        const { signal: s, type, prop } = localSignal;
        const signal = new WeakRef(s);
        const localProp = localSignal.prop;
        const { localName } = enhancedElement;
        const {} = await import('trans-render/lib/prs/prsElO.js');
        const eventSuggestion = localName === 'input' || enhancedElement.hasAttribute('contenteditable') ? 'input' : undefined;
        this.#localSignalAndEvent = {
            eventSuggestion,
            signal,
            //propagator: 
        };
    }
    async #reconcileValues(self, source) {
        if (this.#localSignalAndEvent === undefined || this.#remoteSignalAndEvent === undefined)
            return;
        const { signal: localSignal } = this.#localSignalAndEvent;
        const { eventSuggestion, signal } = this.#remoteSignalAndEvent;
        const { bindingRule } = this;
        const { remoteElO, localEvent } = bindingRule;
        const { getObsVal } = await import('be-linked/getObsVal.js');
        const remoteSignalRef = signal?.deref();
        if (remoteSignalRef === undefined)
            throw 404;
        const { enhancedElement } = self;
        const remoteVal = await getObsVal(remoteSignalRef, remoteElO, enhancedElement);
        const { getSignalVal } = await import('be-linked/getSignalVal.js');
        const { setSignalVal } = await import('be-linked/setSignalVal.js');
        const localSignalRef = localSignal?.deref();
        const localVal = getSignalVal(localSignalRef);
        console.log({ remoteVal, localVal });
        if (localVal === remoteVal)
            return; //TODO:  what if they are objects?
        switch (source) {
            case 'tie':
                {
                    const tieBreaker = compareSpecificity(localVal, remoteVal);
                    const { winner, val } = tieBreaker;
                    switch (winner) {
                        case 'local':
                            setSignalVal(remoteSignalRef, val || localVal);
                            break;
                        case 'remote':
                            setSignalVal(localSignalRef, val || remoteVal);
                            break;
                    }
                }
                break;
            case 'local': {
                setObsVal(remoteSignalRef, remoteElO, localVal);
                break;
            }
            case 'remote': {
                setSignalVal(localSignalRef, remoteVal);
            }
        }
    }
}
function compareSpecificity(localVal, remoteVal) {
    if (localVal === remoteVal)
        return {
            winner: 'tie',
            val: localVal
        };
    //const {breakTie} = await import('./breakTie.js');
    return breakTie(localVal, remoteVal);
}
//TODO: move to be-linked
export async function setObsVal(ref, elo, val) {
    const { prop, elType } = elo;
    //the name "prop" is a bit confusing here -- it used as a locator, e.g. itemprop
    //but when it comes to setting the value, that's not always what we need to use.
    switch (elType) {
        case '#':
        case '@':
            //form associated element, so primary prop is the "value"
            ref.value = val;
            break;
        case '|':
            if (ref.contentEditable === 'true') {
                ref.textContent = val;
            }
            else if ('value' in ref) {
                ref.value = val;
            }
            else {
                throw 'NI';
            }
            break;
        default:
            ref[prop] = val;
    }
}
