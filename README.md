# be-bound [WIP]

be-bound is an attribute-based custom enhancement that provides limited "two-way binding" support. 

[![NPM version](https://badge.fury.io/js/be-bound.png)](http://badge.fury.io/js/be-bound)
[![How big is this package in your project?](https://img.shields.io/bundlephobia/minzip/be-bound?style=for-the-badge)](https://bundlephobia.com/result?p=be-bound)
<img src="http://img.badgesize.io/https://cdn.jsdelivr.net/npm/be-bound?compression=gzip">
[![Playwright Tests](https://github.com/bahrus/be-bound/actions/workflows/CI.yml/badge.svg?branch=baseline)](https://github.com/bahrus/be-bound/actions/workflows/CI.yml)

Limitations:

1.  Binding is 100% equal -- no computed binding, just direct copy of primitives.
2.  Object support is there also, with special logic to avoid infinite loops.  A guid key is assigned to the object to avoid this calamity.
3.  If the two values are equal, no action is taken. 
4.  The two properties must be class properties with setters and getters, either defined explicitly, or dynamically via Object.defineProperty.  Exceptions are if the child is a(n):
    1.  input element.
    2.  form element.
    3.  HTML Element with contentEditable attribute.
    4.  Microdata element (meta, link, data)


## Example 1a:

```html
<my-custom-element>
    #shadow
        ...
        <input name=someStringProp be-bound>
</my-custom-element>
```

... Two way binds input element's value property to my-host-element's hostProp property. 

## Example 1b:

```html
<my-custom-element>
    #shadow
        ...
        <input type=checkbox name=someBoolProp be-bound>
</my-custom-element>
```


 If type=checkbox, checked is used. 
 
 
 
  If type=number, valueAsNumber is used.

During the initial handshake, what if both the input element has a value, and so does my-host-element's hostProp property and they differ?  Which property value "trumps"?

We decide this based on "specificity":

Object type trumps number type which  trumps boolean type which trumps string type which  trumps null type which trumps undefined type.

If the two types are the same, if the two types aren't of type object, the longer toString() trumps the shorter toString().  For object types, use JSON.stringify, and compare lengths.


Example 1a is a shorthand / alternative way of expressing:

## Example 1c:

```html
<my-host-element>
    #shadow
        ...
        <input be-bound='With /someStringProp.'>
</my-host-element>
```

which in turn is shorthand for: [TODO]

```html
<my-host-element>
    #shadow
        ...
        <input be-bound='Between value property observed on input event and /hostProp.'>
</my-host-element>
```

## Example 1d:

```html
<my-host-element>
    #shadow
        ...
        <span contenteditable be-bound='With /someStringProp.'>i am here</span>
</my-host-element>
```

## Example 1e:

```html
<my-host-element>
    #shadow
        <div itemscope>
            <span contenteditable itemprop=someStringProp be-bound>i am here</span>
        </div>
</my-host-element>
```

## Example 1f:

```html
<my-host-element>
    #shadow
        <div itemscope>
            <meta itemprop=someStringProp be-bound>
        </div>
</my-host-element>
```

<!-- maybe make be-linked/be sharing simply apply an enhancement? -->

```html
<my-host-element>
    #shadow
        ...
        <my-child-element be-bound='Between my child prop and / host prop.'>
            ...
        </my-child-element>
</my-host-element>
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
```


## Special Symbols

In the above example, we saw two special symbols used.  Listing them all:

| Symbol      | Meaning              |
|-------------|----------------------|
| /propName   |"Hostish"             |
| @propName   |Name attribute        |
| $propName   |Itemprop attribute    |
| #propName   |Id attribute          |
| -prop-name  |Marker indicates prop |

"Hostish" means:

1.  First, do a "closest" for an element with attribute itemscope, where the tag name has a dash in it.  Do that search recursively.  
2.  If no match found, use getRootNode().host.

## Real world examples

[scratch-box](https://github.com/bahrus/scratch-box/blob/baseline/root.html#L92)

<!-- The child element prop key can also point to a subpath, if it starts with a ".".  This is demonstrated [here](https://github.com/bahrus/co-depends/blob/master/animated-star-rating/make.ts#L50) -->


## Tie Breaking

In the case that the initial values both exist at point of contact (due for example to differing default values), by default the tie-breaker goes to the host, but the user can swap the tie-breaker.

## Options

Each binding can have a third element of the array that allows for fine-tuning the binding. 

<table>
<thead>
<tr>
    <th>Name</th>
    <th>Description</th>
</tr>
</thead>
<tbody>
    <tr>
        <td>localValueTrumps</td>
        <td>If initial values don't match, make the local one trump.</td>
    </tr>
    <tr>
        <td>noClone</td>
        <td>Just pass the object reference without cloning the objects. [Untested]</td>
    </tr>
</tbody>
</table>

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

