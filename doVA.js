export async function doVA(self, bindingRule, abortControllers, evalFn, triggerSrc) {
    import('be-value-added/be-value-added.js');
    const { enhancedElement } = self;
    const beValueAdded = await enhancedElement.beEnhanced.whenResolved('be-value-added');
    bindingRule.localSignal = new WeakRef(beValueAdded);
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
