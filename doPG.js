export async function doPG(self, el, bindingRule, prop, abortControllers, evalFn, triggerSrc) {
    import('be-propagating/be-propagating.js');
    const bePropagating = await el.beEnhanced.whenResolved('be-propagating');
    const signal = await bePropagating.getSignal(prop);
    const signalProp = triggerSrc === 'local' ? 'localSignal' : 'remoteSignal';
    bindingRule[signalProp] = new WeakRef(signal);
    const ab = new AbortController();
    abortControllers.push(ab);
    signal.addEventListener('value-changed', async (e) => {
        if (self.resolved) {
            evalFn(self, triggerSrc);
        }
        else {
            await self.whenResolved();
            evalFn(self, triggerSrc);
        }
    }, { signal: ab.signal });
}