# be-bound (🪢)

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

xtal-element is a declarative custom element solution that takes the live DOM element it belongs to and turns it into a web component for repeated use.  The *be-hive* tag is needed to activate the *be-bound* enhancement within the Shadow DOM realm.

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

What value from the adorned element (input) should be two-way bound the host's currentMode property if it isn't specified?  The rules are as follows:

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
        <input be-bound='with /currentMood.'>
</mood-stone>
```


The slash (/) is a special symbol which we use to indicate that the value of "currentMode" comes from the host web component (*mood-stone* in this case).

We don't have to two-way bind with a property from the host.  We can also two way bind with peer elements within the HTML markup of the web component, based on other [special notation called DSS](https://github.com/bahrus/trans-render/wiki/VIII.--Directed-Scoped-Specifiers-(DSS)), that provides for a powerful way of finding nearby elements / properties with compact syntax.

However, because we anticipate this element enhancement would *most typically* be used to two-way bind to a property coming from the host, we assume that that is the intention if no symbol is provided, making the syntax a little more readable / Hemingway like:

## Least cryptic?

```html
<mood-stone>
    #shadow
        ...
        <input be-bound='with currentMood.'>
</mood-stone>
```

Note that the first word can either be capitalized or not capitalized, whichever seems more readable.

## Non form-associated bindings with contentEditable

```html
<mood-stone>
    #shadow
        ...
        <span contentEditable be-bound='with currentMood.'></span>
</mood-stone>
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

## Two way binding with peer elements

### By Name

```html
<input name=search>
...
<span contenteditable be-bound='with @search.'>
```

### Perimeter support

In the example above, the search for the matching element is done within the nearest form, or within the (shadow)root node.

To specify to search within a closest perimeter, use the ^{...} pattern:

```html
<section>
    Ignore this section
    <input name=search>
</section>
<section>
    Use this section
    <input name=search>
    ...
    <span contenteditable be-bound="with ^{section}@search.">
</section>
```

### By itemprop

```html
<span contenteditable itemprop=search>
...
<input be-bound='with |search.'>
```

In this case, the span's textContent property is kept in synch with the value of the search input element, and vice versa if the user edits the span's content.

The search for the bound element is done, recursively, within itemscope attributed elements, and if not found, within the root node.  Similar perimeterizing can be done done with the ^ qualifier.

## Binding with non visible HTML "Signals"

```html
<meta itemprop=searchProp>
...
<input be-bound='with |searchProp.'>
```

## By id

```html
<input id=search>

...

<span contenteditable be-bound='with #search.'></span>
```

## By marker

```html
<mood-stone -current-mood>
    <template shadowrootmode=open>
        <div itemscope>
            <span itemprop=currentMood></span>
        </div>
        <!-- This turns mood-stone into a custom element -->
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

<input be-bound="with -current-mood">
```

This can also work with built-in elements.

## By peer custom element [TODO]

This is quite similar to the example above, but doesn't involve adding a non-standard attribute to the peer custom element. It's a less less transparent that there is a two way connection, but it opens up more opportunities for customizations.  Anyway..

```html
<mood-stone>
    <template shadowrootmode=open>
        <div itemscope>
            <span itemprop=currentMood></span>
        </div>
        <!-- This turns mood-stone into a custom element -->
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

<input be-bound="with ~MoodStone:currentMode">
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

## Being more explicit

In all the examples we've seen so far, the element adorned by this *be-bound* enhancement was a built-in element, where we can usually infer the property we would want to bind to ("value" for input element, "textContent" from other types, for example).


What happens if our local element we are adorning isn't a built-in element.  What we need to (or simply want to) be more explicit about what's happening? To support this, we need to switch from "with" statements, like we've seen thus far with "between" statements, as demonstrated below:

## Specifying local property to bind to

```html
<label>
    <input name=howAmIFeeling>
</label>
...
<mood-stone enh-be-bound='between currentMood and @howAmIFeeling.'></my-custom-element>

```


We add the extra enh- prefix to hopefully avoid "stepping on the toes" of some other custom enhancement, based on the recommended reserved [prefix for this purpose](https://github.com/WICG/webcomponents/issues/1000).

So, when the attribute starts with the word "Between" or "between",  as opposed to "With" or "with", it means we are specifying, first, the name of the local property name of the adorned element that we want to "sync up" with an "upstream" element.  In this case, with the input element based on the name attribute.  (But we can also synchronize with host properties if we use the "/" "sigil" as we've seen previously, or no sigil at all). 

## Specifying remote property to bind to [TODO]



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

