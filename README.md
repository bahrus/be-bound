# be-bound

be-bound is an attribute-based decorator/behavior that provides limited "two-way binding" support. 

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
2.  No object support yet [TODO]
3.  If the two values are equal (or timestamps match in case of objects), no action is taken. 
4.  The two properties must be class properties with setters and getters, either defined explicitly, or dynamically via Object.defineProperty.  Exception is input element for child.

## Tie Breaking


In the case that the initial values both exist at point of contact (due for example to differing default values), by default the tie-breaker goes to the host, but the user can specify which value trumps the other.

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
        <td>Just pass the object reference without cloning the objects. [TODO]</td>
    </tr>
</tbody>
</table>

