export class MyCustomElement extends HTMLElement {
    #someStringProp;
    get someStringProp() {
        return this.#someStringProp;
    }
    set someStringProp(nv) {
        this.#someStringProp = nv;
    }
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }
    connectedCallback() {
        this.shadowRoot.innerHTML = String.raw `
        <input name=someStringProp value=hello be-bound>
        <be-hive></be-hive>
    `;
    }
}
customElements.define('my-custom-element', MyCustomElement);
