# be-bound

be-bound is an attribute-based custom enhancement that provides limited "two-way binding" support. 

It follows almost identical patterns to other [be-enhanced](https://github.com/bahrus/be-enhanced) based binding enhancements, especially [be-observant](https://github.com/bahrus/be-observant).

[![NPM version](https://badge.fury.io/js/be-bound.png)](http://badge.fury.io/js/be-bound)
[![How big is this package in your project?](https://img.shields.io/bundlephobia/minzip/be-bound?style=for-the-badge)](https://bundlephobia.com/result?p=be-bound)
<img src="http://img.badgesize.io/https://cdn.jsdelivr.net/npm/be-bound?compression=gzip">
[![Playwright Tests](https://github.com/bahrus/be-bound/actions/workflows/CI.yml/badge.svg?branch=baseline)](https://github.com/bahrus/be-bound/actions/workflows/CI.yml)

Limitations:

1.  Binding is 100% equal -- no [computed binding](https://github.com/bahrus/be-computed), just direct copy of primitives.
2.  Object support is there also, with special logic to avoid infinite loops.  A guid key is assigned to the object to avoid this calamity. [TODO, only if strong use case is found].
3.  If the two values are equal, no action is taken. 
4.  The two properties must be class properties with setters and getters, either defined explicitly, or dynamically via Object.defineProperty.  Exceptions are if the child is a(n):
    1.  input element.
    2.  form element.
    3.  HTML Element with contentEditable attribute.
    4.  Microdata element (meta, link, data)

## Special Symbols

In the examples below, we will encounter special symbols used in order to keep the statements small:

| Symbol                             | Meaning                                                                      | Notes                                                                                           |
|------------------------------------|------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------|
| /propName                          | "Hostish"                                                                    | Attaches listeners to a "propagator" EventTarget.                                               |
| @propName                          | Name attribute                                                               | Listens for input events by default.                                                            |
| \|propName                         | Itemprop attribute                                                           | If contenteditible, listens for input events by default.  Otherwise, uses be-value-added.       |
| #propName                          | Id attribute                                                                 | Listens for input events by default.                                                            |
| -prop-name                         | Marker indicates prop                                                        | Attaches listeners to a "propagator" EventTarget.                                               |
| ~customElementNameInCamelCase      | Peer custom element within the nearest itemscope perimeter (recursively)     | Attaches listeners to a "propagator" EventTarget.                                               |

"Hostish" means:

1.  First, do a "closest" for an element with attribute itemscope, where the tag name has a dash in it.  Do that search recursively.  
2.  If no match found, use getRootNode().host.

# Part I Full Inference

## The most quintessential example

```html
<mood-stone>
    <template shadowrootmode=open>
        <div itemscope>
            <span itemprop=currentMood></span>
        </div>
        <input 
            name=currentMood 
            be-bound
        >
        <xtal-element
            prop-defaults='{
                "currentMood": "Happy"
            }'
            xform='{
                "| currentMood": 0
            }'
        ></xtal-element>
        <be-hive></be-hive>
    </template>
</mood-stone>
```

xtal-element is a declarative custom element solution that takes the live DOM element it belongs to and turns it into a web component for repeated use.  The thing to focus on is:

```html
<mood-stone>
    <template shadowrootmode=open>
        <input 
            name=currentMood 
            be-bound
        >
    </template>
</mood-stone>
```

*be-bound* two-way binds the input element's value property to mood-stone's currentMood property.  Here, be-bound is "piggy-backing" on the name of the input element, in the common use case that the name matches the property name from the host that we are binding to.  Scroll down to see how the syntax changes a bit to support scenarios where we can't rely on the name of the input field matching the host's property.

What value from the adorned element (input) should be two-way bound the host's someStringProp property if it isn't specified?  The rules are as follows:

## Some type aware inferencing:

```html
<my-custom-element>
    #shadow
        ...
        <input type=checkbox name=someBoolProp be-bound>
</my-custom-element>
```

If type=checkbox, property "checked" is used in the two way binding. 

If type=number, valueAsNumber is used.

During the initial handshake, what if both the input element has a value, and so does my-host-element's hostProp property and they differ?  Which property value "trumps"?

We decide this based on "specificity":

Object type trumps number type which  trumps boolean type which trumps string type which  trumps null type which trumps undefined type.

If the two types are the same, if the two types aren't of type object, the longer toString() trumps the shorter toString().  For object types, use JSON.stringify, and compare lengths.

As mentioned, we can't alway rely on using the name attribute to specify the host property name we want to bind to.

So now we start adding some information into the be-bound attribute.  

For that, we use what I call "Hemingway notation" within the attribute, where the text of the attribute is meant to form a complete, grammatically correct sentence, ideally.  Strictly speaking, the sentence sounds more complete if the "be-bound" attribute name is considered as part of the sentence.  So please apply a little bit of generous artistic license to the principle we are trying to follow here, dear reader.

## Specifying the host property name.

```html
<my-custom-element>
    #shadow
        ...
        <input be-bound='With /someStringProp.'>
</my-custom-element>
```

## Using smaller words.

I find this a bit more readable, personally (but it is admittedly subjective).  Anyway, it is supported:

```html
<my-custom-element>
    #shadow
        ...
        <input be-bound='With / some string prop.'>
</my-custom-element>
```

Both will work, so it is a matter of taste which is more readable/easier to type.

The slash (/) is a special symbol which we use to indicate that someStringProp comes from the host.

We don't have to two-way bind with a property from the host.  We can also two way bind with peer elements within the HTML markup of the web component, based on other [single character symbols](https://github.com/bahrus/be-bound#special-symbols), which indicates what we are binding to.

However, because we anticipate this element enhancement would *most typically* be used to two-way bind to a property coming from the host, we assume that that is the intention if no symbol is provided, making the syntax a little more readable / Hemingway like:

## Least cryptic?

```html
<my-custom-element>
    #shadow
        ...
        <input be-bound='with some string prop.'>
</my-custom-element>
```

Note that the first word can either be capitalized or not capitalized, whichever seems more readable.


## Non form-associated bindings with contentEditable

```html
<my-custom-element>
    #shadow
        ...
        <span contenteditable be-bound='with /someStringProp.'>i am here</span>
</my-custom-element>
```

## Use of itemprop microdata attribute

```html
<my-custom-element>
    #shadow
        <div itemscope>
            <span contenteditable itemprop=someStringProp be-bound>i am here</span>
        </div>
</my-custom-element>
```


> [!Note]
> If using this enhancement with itemprop attributes,  together with [be-sharing](https://github.com/bahrus/be-sharing), it is safest to add attribute "--" to the enhanced element, to let be-sharing know that this enhancement is responsible for the binding, rather than be-sharing:

```html
<my-custom-element>
    #shadow
        <div itemscope>
            <meta -- itemprop=someStringProp be-bound>
        </div>
</my-custom-element>
```

## Example 1g:

```html
<my-custom-element>
    #shadow
        <input name=search>

        ...

        <span contenteditable be-bound='with @search.'>
</my-custom-element>
```

## Example 1h:

```html
<my-custom-element>
    #shadow
    <div itemscope>
        <span contenteditable itemprop=search>

        ...
        
        <input be-bound='with |search.'>
    </div>
</my-custom-element>
```

In this case, the span's textContent property is kept in synch with the value of the search input element.

## Example 1i:

```html
<my-custom-element>
    #shadow
    <div itemscope>
        <meta itemprop=searchProp>

        ...
        
        <input be-bound='with $ search prop.'>
    </div>
</my-custom-element>
```

## Example 1j

```html
<my-custom-element>
    #shadow
        <input id=some-id>

        ...

        <span contenteditable be-bound='with # some id.'></span>
</my-custom-element>
```

## Example 1k

```html
<my-custom-element>
    #shadow
        <another-custom-element -some-string-prop></another-custom-element>

        ...

        <span contenteditable be-bound='with -some-string-prop.'>abc</span>
</my-custom-element>
```



<!-- maybe make be-linked/be sharing simply apply an enhancement? -->

<!-- ```html
<my-custom-element>
    #shadow
        ...
        <my-child-element be-bound='Between my child prop and / host prop.'>
            ...
        </my-child-element>
</my-custom-element>
```

or more compactly:

```html
<my-host-element>
    #shadow
        ...
        <my-child-element be-bound='Between myChildProp and /hostProp.'>
            ...
        </my-child-element>
</my-host-element>
``` -->

# More complex scenarios

What happens if our local element we are adorning isn't a built-in element, where we can infer, with minimal hints, what we want to happen? To support this, we need to switch from "With" statements, like we've seen thus far with "Between" statements, as demonstrated below:

## Example 2a:

```html
<form>
<input name=search>
...
<my-custom-element be-bound='between someStringProp and @search.'></my-custom-element>
</form>
```

So, when the attribute starts with the word "Between" or "between",  as opposed to "With" or "with", it means we are specifying, first, the name of the local property name of the adorned element that we want to "sync up" with an "upstream" element.  In this case, with the input element based on the name attribute.  (But we can also synchronize with host properties if we use the "/" "sigil" as we've seen previously, or no sigil at all). 

## Example 2b: Special logic for forms

```html
<input id=alternativeRating type=number>
<form be-bound='between rating and #alternativeRating.'>
    <div part=rating-stars class="rating__stars">
        <input id="rating-1" class="rating__input rating__input-1" type="radio" name="rating" value="1">
        <input id="rating-2" class="rating__input rating__input-2" type="radio" name="rating" value="2">
        <input id="rating-3" class="rating__input rating__input-3" type="radio" name="rating" value="3">
        <input id="rating-4" class="rating__input rating__input-4" type="radio" name="rating" value="4">
        <input id="rating-5" class="rating__input rating__input-5" type="radio" name="rating" value="5">
    </div>  
</form>
```



## Real world examples [TODO:  update to use the current syntax]

[scratch-box](https://github.com/bahrus/scratch-box/blob/baseline/root.html#L92)

<!-- The child element prop key can also point to a subpath, if it starts with a ".".  This is demonstrated [here](https://github.com/bahrus/co-depends/blob/master/animated-star-rating/make.ts#L50) -->



## Viewing Demos Locally

Any web server that can serve static files will do, but...

1.  Install git.
2.  Fork/clone this repo.
3.  Install node.js.
4.  Open command window to folder where you cloned this repo.
5.  > npm install
6.  > npm run serve
7.  Open http://localhost:3030/demo/ in a modern browser.

## Running Tests

```
> npm run test
```

## Using from ESM Module:

```JavaScript
import 'be-bound/be-bound.js';
```

## Using from CDN:

```html
<script type=module crossorigin=anonymous>
    import 'https://esm.run/be-bound';
</script>
```

