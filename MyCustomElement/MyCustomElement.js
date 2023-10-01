export class MyCustomElement extends HTMLElement {
    #someStringProp;
    get someStringProp() {
        return this.#someStringProp;
    }
    set someStringProp(nv) {
        //console.log('set someStringProp = ' + nv);
        this.#someStringProp = nv;
        if (nv === undefined)
            return;
        const div = this.shadowRoot?.querySelector('#someStringPropVal');
        if (div !== null && div !== undefined)
            div.textContent = nv;
    }
    #someBoolProp;
    get someBoolProp() {
        return this.#someBoolProp;
    }
    set someBoolProp(nv) {
        this.#someBoolProp = nv;
        const div = this.shadowRoot?.querySelector('#someBoolPropVal');
        if (div !== null && div !== undefined)
            div.textContent = '' + nv;
    }
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        //this.someStringProp = 'hello2';
    }
    connectedCallback() {
        this.shadowRoot.innerHTML = String.raw `
        <div itemscope>
            <div id=someStringPropVal></div>
            <div id=someBoolPropVal></div>
            <input name=someStringProp value=hello be-bound>
            <input name=someBoolProp type=checkbox be-bound>
            <input be-bound='With /someStringProp.'>
            <span contenteditable be-bound='With /someStringProp.'></span>
            <span contenteditable itemprop=someStringProp be-bound></span>
        </div>
        <be-hive></be-hive>
    `;
    }
}
customElements.define('my-custom-element', MyCustomElement);
