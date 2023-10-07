export class MyCustomElement extends HTMLElement{
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
        //this.someStringProp = 'hello2';
    }

    connectedCallback(){
        this.shadowRoot!.innerHTML = String.raw `
        <div itemscope>
            <div id=someStringPropVal></div>
            <div id=someBoolPropVal></div>
            <h3>Example 1a</h3>
            <input name=someStringProp value=hello be-bound>
            <h3>Example 1b</h3>
            <input name=someBoolProp type=checkbox be-bound>
            <h3>Example 1c</h3>
            <input be-bound='With /someStringProp.'>
            <h3>Example 1c-take-two</h3>
            <input be-bound='with some string prop.'>
            <input be-bound='With some string prop.'>


            <h3>Example 1d</h3>
            <span contenteditable be-bound='With /someStringProp.'></span>

            <h3>Example 1e</h3>
            <span contenteditable itemprop=someStringProp be-bound></span>

            <h3>Example 1f</h3>
            <meta itemprop=someStringProp be-bound>

            <h3>Example 1g</h3>
            <input name=search value=12345>
            ...
            <span contenteditable be-bound='With @search.'></span>

            
            <h3>Example 1h</h3>
            <span contenteditable itemprop=search>lalala</span>

            <input be-bound='with $search.'>
            
        </div>
        <be-hive></be-hive>
    `;
    }
}

customElements.define('my-custom-element', MyCustomElement);