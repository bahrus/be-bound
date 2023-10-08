import {BindingRule, AP, TriggerSource} from './types';
import {BVAAllProps} from 'be-value-added/types';
import {BeBound} from './be-bound.js';

export async function doVA(
    self:  BeBound,
    el: Element,
    bindingRule: BindingRule, 
    abortControllers: Array<AbortController>,
    evalFn: (self: BeBound, triggerSrc: TriggerSource) => void,
    triggerSrc: TriggerSource){
    import('be-value-added/be-value-added.js');
    //const {enhancedElement} = self;
    const beValueAdded = await  (<any>el).beEnhanced.whenResolved('be-value-added') as BVAAllProps & EventTarget;
    const signalProp = triggerSrc === 'local' ? 'localSignal' : 'remoteSignal';
    bindingRule[signalProp] = new WeakRef<BVAAllProps>(beValueAdded);
    const ab = new AbortController();
    abortControllers.push(ab);
    beValueAdded.addEventListener('value-changed', async e => {
        if(self.resolved){
            evalFn(self, triggerSrc);
        }else{
            await self.whenResolved();
            evalFn(self, triggerSrc);
        }
    }, {signal: ab.signal});
}