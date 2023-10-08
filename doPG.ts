import {BindingRule, AP, TriggerSource} from './types';
import {BeBound} from './be-bound.js';
import 'be-propagating/be-propagating.js'
export async function doPG(
    self:  BeBound,
    el: Element,
    bindingRule: BindingRule,
    prop: string, 
    abortControllers: Array<AbortController>,
    evalFn: (self: BeBound, triggerSrc: TriggerSource) => void,
    triggerSrc: TriggerSource
){
    const bePropagating = await (<any>el).beEnhanced.whenResolved('be-propagating') as BPActions;
    const signal = await bePropagating.getSignal(prop);
    const signalProp = triggerSrc === 'local' ? 'localSignal' : 'remoteSignal';
    bindingRule[signalProp] = new WeakRef(signal);
    const ab = new AbortController();
    abortControllers.push(ab);
    signal.addEventListener('value-changed', async () => {
        if(self.resolved){
            evalFn(self, triggerSrc);
        }else{
            await self.whenResolved();
            evalFn(self, triggerSrc);
        }
        
    }, {signal: ab.signal});
}