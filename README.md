# be-bound (🪢)

be-bound is an attribute-based custom enhancement that provides limited "two-way binding" support. 

It follows almost identical patterns to other [be-enhanced](https://github.com/bahrus/be-enhanced) based binding enhancements, especially [be-observant](https://github.com/bahrus/be-observant).

[![NPM version](https://badge.fury.io/js/be-bound.png)](http://badge.fury.io/js/be-bound)
[![How big is this package in your project?](https://img.shields.io/bundlephobia/minzip/be-bound?style=for-the-badge)](https://bundlephobia.com/result?p=be-bound)
<img src="http://img.badgesize.io/https://cdn.jsdelivr.net/npm/be-bound?compression=gzip">
[![Playwright Tests](https://github.com/bahrus/be-bound/actions/workflows/CI.yml/badge.svg?branch=baseline)](https://github.com/bahrus/be-bound/actions/workflows/CI.yml)

Limitations:

1.  Binding is 100% equal -- no [computed binding](https://github.com/bahrus/be-computed), just direct copy of primitives.
2.  [TODO, only if strong use case is found]. Object support could be added also, with special logic to avoid infinite loops.  A guid key is assigned to the object to avoid this calamity. 
3.  If the two values are equal, no action is taken. 
4.  One or both properties can be class properties with setters and getters, either defined explicitly, or dynamically via Object.defineProperty.  Exceptions are if the child is a(n):
    1.  input element.
    2.  form element.
    3.  HTML Element with contentEditable attribute.
    4.  Microdata element (meta, link, data)
5.  Alternatively, one or both properties can be "source of truth" attributes that reflects the specified property value. [TODO]
6.  If placed outside any shadowDOM that uses a host property path, it will two-way bind to the url query parameter or hash parameter of the specified name. [TODO]

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

*xtal-element* is a declarative custom element solution that takes the live DOM element it belongs to and turns it into a web component for repeated use.  The *be-hive* tag is needed to activate the *be-bound* enhancement within the Shadow DOM realm.

The thing to focus on is:

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

What value from the adorned element (input) should be two-way bound to the host's currentMode property if it isn't specified?  The rules are as follows:

If type=checkbox, property "checked" is used in the two way binding. 

If type=number, valueAsNumber is used.

During the initial handshake, what if both the input element has a value, and so does my-host-element's hostProp property and they differ?  Which property value "trumps"?

We decide this based on "specificity":

Object type trumps number type which  trumps boolean type which trumps string type which  trumps null type which trumps undefined type.

If the two types are the same, if the two types aren't of type object, the longer toString() trumps the shorter toString().  For object types, use JSON.stringify, and compare lengths.


## Some type aware inferencing:

```html
<mood-stone>
    <template shadowrootmode=open>
        <div itemscope>
            <span itemprop=isHappy></span>
        </div>
        <input 
            name=isHappy
            type=checkbox
            be-bound
        >
        <xtal-element
            prop-defaults='{
                "isHappy": true
            }'
            xform='{
                "| isHappy": 0
            }'
        ></xtal-element>
        <be-hive></be-hive>
    </template>
</mood-stone>
```

As mentioned, we can't always rely on using the name attribute to specify the host property name we want to bind to.


So now we start adding some information into the be-bound attribute.  

For that, we use what I call "Hemingway notation" within the attribute, where the text of the attribute is meant to form a complete, grammatically correct sentence, ideally.  Strictly speaking, the sentence sounds more complete if the "be-bound" attribute name is considered as part of the sentence.  So please apply a little bit of generous artistic license to the principle we are trying to follow here, dear reader.

## Specifying the host property name.

```html
<mood-stone>
    #shadow
        ...
        <input be-bound='with currentMood.'>
</mood-stone>
```


We don't have to two-way bind with a property from the host.  We can also two way bind with peer elements within the HTML markup of the web component, based on other [special notation called DSS](https://github.com/bahrus/trans-render/wiki/VIII.--Directed-Scoped-Specifiers-(DSS)), that provides for a powerful way of finding nearby elements / properties with compact syntax.



Note that the first word ("with") can either be capitalized or not capitalized, whichever seems more readable.

Now we suggest an alternative syntax that is shorter than the syntax above, but is a bit more cryptic.

If the name "be-bound" seems rather long to have to type over and over again, you can define your own name.  This package contains one suggestion for a shorter name, as a kind of [reference implementation](https://github.com/bahrus/be-bound/blob/baseline/%F0%9F%AA%A2.ts):

```html
<mood-stone>
    #shadow
        ...
        <input 🪢='with currentMood.'>
</mood-stone>
```



## Non form-associated bindings with contentEditable

```html
<mood-stone>
    <template shadowrootmode=open>
        ...
        <span contentEditable 🪢='with currentMood.'></span>
        ...
    </template>
</mood-stone>
```

## Use of itemprop microdata attribute

```html
<my-custom-element>
    <template shadowrootmode=open v>
        ...
        <span contenteditable itemprop=someStringProp 🪢>i am here</span>
        ...
    </template>
</my-custom-element>
```

The two way binding is now done with the host's someStringProp property.

## Two way binding with peer elements

```html
<input id=search>
...
<span contenteditable 🪢='with #search.'>
```

## Being more explicit

In all the examples we've seen so far, the element adorned by this *be-bound* enhancement was a built-in element, where we can usually infer the property we would want to bind to ("value" for input element, "textContent" from other types, for example).


What happens if our local element we are adorning isn't a built-in element.  What if we need (or simply want) to be more explicit about what's happening? To support this, we need to switch from "with" statements, like we've seen thus far with "between" statements, as demonstrated below:

## Specifying local property to bind to

```html
<label>
    <input id=howAmIFeeling>
</label>
...
<mood-stone enh-🪢='between currentMood and #howAmIFeeling.'></my-custom-element>

```


We add the extra enh- prefix to hopefully avoid "stepping on the toes" of some other custom enhancement, based on the recommended reserved [prefix for this purpose](https://github.com/WICG/webcomponents/issues/1000).

So, when the attribute starts with the word "Between" or "between",  as opposed to "With" or "with", it means we are specifying, first, the name of the local property name of the adorned element that we want to "sync up" with an "upstream" element.  In this case, with the input element.  But we can also synchronize with host properties. 

## Special logic for forms

```html
<input id=alternativeRating type=number>
<form be-bound='between rating:value::change and #alternativeRating.'>
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



## Viewing Locally

Any web server that serves static files with server-side includes will do but...

1.  Install git.
2.  Fork/clone this repo.
3.  Install node.
4.  Open command window to folder where you cloned this repo.
5.  > npm install
6.  > npm run serve
7.  Open http://localhost:8000 in a modern browser.

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

