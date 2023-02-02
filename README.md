# be-bound

be-bound is an attribute-based decorator/behavior that provides limited "two-way binding" support. 

<a href="https://nodei.co/npm/be-bound/"><img src="https://nodei.co/npm/be-bound.png"></a>

[![How big is this package in your project?](https://img.shields.io/bundlephobia/minzip/be-bound?style=for-the-badge)](https://bundlephobia.com/result?p=be-bound)

<img src="http://img.badgesize.io/https://cdn.jsdelivr.net/npm/be-bound?compression=gzip">

[![Playwright Tests](https://github.com/bahrus/be-bound/actions/workflows/CI.yml/badge.svg?branch=baseline)](https://github.com/bahrus/be-bound/actions/workflows/CI.yml)

## Lingo

```html
<my-host-element>
    #shadow
        ...
        <my-child-element be-bound='{
            "propBindings":[
                ["myChildElementProp", "myHostElementProp"]
            ]
        }'>
            ...
        </my-child-element>
</my-host-element>
```



So basically, this keeps the two props in sync. 

Limitations:

1.  Binding is 100% equal -- no computed binding, just direct copy of primitives.
2.  Object support is there also, with special logic to avoid infinite loops.  A guid key is assigned to the object to avoid this calamity.
3.  If the two values are equal, no action is taken. 
4.  The two properties must be class properties with setters and getters, either defined explicitly, or dynamically via Object.defineProperty.  Exceptions are if the child is a(n):
    1.  input element.
    2.  form element.

The exceptions -- (4.1, 4.2, event handler "input" is used)

Shortcuts:

If just binding one pair of props: 

```html
<my-host-element>
    #shadow
        ...
        <my-child-element be-bound='[["myChildElementProp", "myHostElementProp"]]'>
            ...
        </my-child-element>
</my-host-element>
```

If myChildElementProp is "value", just do:

```html
<my-host-element>
    #shadow
        ...
        <my-child-element be-bound='["myHostElementProp"]'>
            ...
        </my-child-element>
</my-host-element>
```


## Real world examples

[scratch-box](https://github.com/bahrus/scratch-box/blob/baseline/make.ts#L18)

The child element prop key can also point to a subpath, if it starts with a ".".  This is demonstrated [here](https://github.com/bahrus/co-depends/blob/master/animated-star-rating/make.ts#L50)


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

