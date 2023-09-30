export class MyCustomElement extends HTMLElement{
    #someStringProp: string | undefined;
    get someStringProp(){
        return this.#someStringProp;
    }
    set someStringProp(nv){
        this.#someStringProp = nv;
        if(nv === undefined) return;
        const div = this.shadowRoot?.querySelector('#someStringPropVal');
        if(div !== null && div !== undefined) div.textContent = nv;
    }

    #someBoolProp: boolean | undefined;
    get someBoolProp(){
        return this.#someBoolProp;
    }
    set someBoolProp(nv){
        this.#someBoolProp = nv;
        const div = this.shadowRoot?.querySelector('#someBoolPropVal');
        if(div !== null && div !== undefined) div.textContent = '' + nv;
    }

    constructor(){
        super();
        this.attachShadow({mode: 'open'});
    }

    connectedCallback(){
        this.shadowRoot!.innerHTML = String.raw `
        <div id=someStringPropVal></div>
        <div id=someBoolPropVal></div>
        <input name=someStringProp value=hello be-bound>
        <input name=someBoolProp type=checkbox be-bound>
        <be-hive></be-hive>
    `;
    }
}

customElements.define('my-custom-element', MyCustomElement);