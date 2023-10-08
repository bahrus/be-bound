export class AnotherCustomElement extends HTMLElement{
    #someStringProp: string | undefined;
    get someStringProp(){
        return this.#someStringProp;
    }
    set someStringProp(nv){
        //console.log('set someStringProp = ' + nv);
        this.#someStringProp = nv;
        if(nv === undefined) return;
        const div = this.shadowRoot?.querySelector('#someStringPropVal');
        if(div !== null && div !== undefined) div.textContent = nv;
    }

    connectedCallback(){
        this.shadowRoot!.innerHTML = String.raw `
        <div itemscope>
            <div id=someStringPropVal></div>
        </div>
        `;
    }
}