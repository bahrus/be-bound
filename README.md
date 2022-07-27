# be-bound

be-bound is an attribute-based decorator/behavior that provides limited "two-way binding" support. 

```html
<my-host-element>
    #shadow
        ...
        <my-child-element be-bound='{
            "myChildElementProp": "myHostElementProp"
        }'>
            ...
        </my-child-element>
</my-host-element>
```

So basically, this keeps the two props in sync. 

Limitations:

1.  Binding is 100% equal -- no computed binding, just direct copy (after cloning in the case of objects).  
2.  No sub property support
3.  In case of objects, clone is made first.  Timestamps used to determine the latest version.
4.  If the two values are equal (or timestamps match in case of objects), no action is taken.
5.  The two properties must be class properties with setters and getters, either defined explicitly, or dynamically via Object.defineProperty.

## Tie Breaking


In the case that the initial values both exist at point of contact, the user can specify which value trumps the other by adding a ! to the end of the property name.