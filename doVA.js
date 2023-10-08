export async function doVA(self, el, bindingRule, abortControllers, evalFn, triggerSrc) {
    import('be-value-added/be-value-added.js');
    //const {enhancedElement} = self;
    const beValueAdded = await el.beEnhanced.whenResolved('be-value-added');
    const signalProp = triggerSrc === 'local' ? 'localSignal' : 'remoteSignal';
    bindingRule[signalProp] = new WeakRef(beValueAdded);
    const ab = new AbortController();
    abortControllers.push(ab);
    beValueAdded.addEventListener('value-changed', async (e) => {
        if (self.resolved) {
            evalFn(self, triggerSrc);
        }
        else {
            await self.whenResolved();
            evalFn(self, triggerSrc);
        }
    }, { signal: ab.signal });
}
