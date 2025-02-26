---
title: Styles
description: A collection of styles that can be used when authoring the textbook.
hidden: true
---

# Heading 1
## Heading 2
### Heading 3
#### Heading 4
##### Heading 5
###### Heading 6

Here is a link to [another section](#code-blocks).

---

## Code Blocks

Here is a syntax highlighted code block. Notice that you can add a marker to the code by inserting `` `[]` ``, which can be helpful if you need to refer to a particular line in the surrounding content.

```cpp
int main() {
  std::cout << "Hello world!" << std::endl; `[]`
  return 0;
}
```

Here is an editable syntax highlighted code block. These will ultimately be runnable segments with a `Run` button attached:

```cpp,runnable
int main() {
  std::cout << "Hello world!" << std::endl; `[]`
  return 0;
}
```

You can initially focus on a section of the code segment by surrounding it with `---` lines:

```cpp,runnable
int main() {
---
std::cout << "Hello world!" << std::endl; `[]`
return 0;
---
}
```

You can also highlight a region of code to draw attention to it by surrounding that region with `` `[]` ``:

```cpp,runnable
int main() {
---
std::cout `[<< "Hello world!" <<]` std::endl; `[]`
`[return 0;]` `[]`
---
}
```

Note that highlighted regions cannot overlap a focus boundary (`---`).

You can also use `inline code`, although this won't be syntax highlighted.

## Footnotes

This text has a footnote attached[^1].

[^1]: Here is the content of the footnote. It will always render at the bottom of the page.

## Tables

Here is a table. The first column is left aligned, the middle is centered, and the right is right aligned.

size | material     | color
-----|:------------:|------------:
9    | leather      | brown
10   | hemp canvas  | natural
11   | glass        | transparent

## Blockquotes

You can use blockquotes to interleave information.

> Here is a single-line block quote.  

> Here is a multi-line block quote.  
> Block quotes can span multiple lines and can contain **markdown**.
>
> ```cpp
> int main() {
>   std::cout << "Hello world!" << std::endl;
>   return 0;
> }
> ```
> 

Here is some text beneath the blockquote.

## Quizzes

```yaml,quiz
quiz: basic-types
questions:
  q1:
    type: multiple-choice
    prompt: This is a quiz question
    answers: 
      a1: |
        ~~~cpp
        void foo() { 
          std::cout << "hello" << std::endl; 
        }
        ~~~
      a2: Another answer
    distractors:
      d1: A wrong answer
      d2: Another wrong answer
      d3: Another wrong answer!!
  q2: 
    type: multiple-choice
    prompt: Another quiz question goes here
    answers:
      a1: This is a single answer
    distractors:
      a2: This is a single distractor
```

## Memory Diagrams

Memory diagrams allow you to embed short diagrams showcasing the structure of memory at some point in a program. For example, here is an example showing the allocation of a vector on the stack/heap:

```memory
main:
vec = "Vector<int>" {size: 4, capacity: 10, data: &data}
data => b"1234______"

#style highlight data[:4]
```

As you can see, diagrams consist of a series of assignments (`vec = ...`) on the stack (which may occur inside of a frame like `main:`) along with heap allocations (`data => ...`). Diagram elements can be styled either with a CSS class or by embedding a raw CSS object. Here's a more complicated example that uses subdiagrams (note how each subdiagram now has a title like `L2`, `L3`):

```cpp
int main() {
  std::cout << "I love C++!" << std::endl;
  return 0;
}
```

```memory
L1 {
  #layout wide
  
  #label stack "Stream"
  #label heap ""

  #label title "**A Custom Title**"
  #label subtitle "This is the diagram subtitle. 
  
  ~~~cpp
  int main() {}
  ~~~
  "

  cin("std::cin") = &data[6]  
  data => b"Bjarne Stroustrup"

  #style highlight data[:6]
  #style:link { dash: { animation: true } } cin
  #style:name { color: "red" } cin
}

L2 {
  #label subtitle "This one has a *red* subtitle."

  main:
  foo = &data
  data => [1,2,3]

  #style:label { color: red } subtitle
}

L3 {
  x = 1
  foo:
  y = 2    
}
```

Note how in the above, placing a diagram immediately below a code block causes the two to appear merged together.

### Syntax

#### Variables

Use `=` to indicate an assignment to a variable on the stack. Assignments can optionally live inside of *stack frames*.

```memory
v = 106
main:
x = 1
y = 4
foo:
x = 3
y = 6

#style:row highlight main.x
```

Two stack frames and/or global variables may not share the same name, and variable names within a stack frame must be unique. That said, you can change the displayed label of a variable/stack frame using special syntax, while keeping its programmatic name:

```memory
v("custom name") = 106
main("not a problem"):
x = 1
y = 4
foo("not a problem"):
x = 3
y("x") = 6

#style highlight main
```

Variable names follow the same rules as C-style variables (alphanumeric characters and underscores), with the exception that they are allowed to start with a number.

#### Heap allocation

Use `=>` to refer to an allocation on the heap. All allocations will be lumped together, so you can intersperse stack assignments and heap allocations freely, but the order of `=>` statements determines the order that they appear in the heap. Note that the names of heap allocations are purely internal (e.g. for creating pointers, styling, etc.)

```memory
old = &buffer1
buffer1 => This is a string
new = &buffer2
buffer2 => This is another string
```

#### Multiple heaps

Use `=>` with any number of equal signs to refer to a different section of the heap. This is useful when representing a complicated memory layout, for example an array of arrays (for example when representing an `std::deque`):

```memory
d = "deque<int>" { blocks: &blocks }
blocks => [ &0, &1, &2 ]
0 ==> b"__23"
1 ==> b"4567"
2 ==> b"89__"

#label ==> "...A heap far far away"
```

#### Value types

There are multiple different kinds of values that can occur on the right-hand side of an `=` or `=>`.

##### Literals

A literal value is a catch all. If no other value could be parsed, the literal catches it. The only restrictions on literals are that they contain no grouping symbols that might confuse the parser, e.g. `[]{},:` or newlines. 

```memory
x = true
b = 123
f = 12.2
```

##### Strings

These function like Python or C++ strings, and can get around the grouping character restriction for literals. Single character escapes will be escaped into their true value, e.g. `\n` becomes a newline.

```memory
x = "I {have} [grouping] : characters"
b = "This string\nhas a newline"
q = "This string \"has an embedded quote\""
```

##### Arrays

These work like Python lists, and can be nested. By default, only nested arrays have a border around them. To change this, you can doubly nest a single array.

```memory
arr = [1, 2, 3, 4]
nested = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
border = [[1, 2, 3]]
```

##### Array strings

Strings with a `b` in front of them, e.g. `b"hello world"`, will be treated as character arrays. Single character escapes are unescaped and treated as one character. These function exactly like arrays above, but are a shorthand so you don't have to write out all the `[`, `,` and `]` characters.

```memory
bjarne = b"Bjarne stroustrup"
escape = b"Time\nis\nspace"
#style { color: #F27800 } escape[4] escape[7]
```

##### Objects

Objects are simple key-value pair collections, and work similarly to JavaScript object literals. An object can optionally have a label attached to it (e.g. to indicate its type) which can either be a variable name or a string literal. Objects can be nested. Object field names must be variables with unique names, but like variables, they can be renamed using the `("label")` syntax.

```memory
pair = { first: "Eggs", second: 12 }
vec = vector { size: 5, capacity: 10 }
stdVec = "std::vector" { size: 5, capacity: 10 }
nested = { first: true, second: { first: 0.0, second: 1.0 }}
rename = { first("Custom field"): true, second("Another label"): false }
```

##### Unlabelled objects

An unlabelled object can be created by replacing the `{}` with `[]` in the object notation. This still represents a collection of named fields--the only difference is that the field names are hidden. This might be useful, for example, to show a vertical array.

```memory
v = [ 0: welcome, 1: to, 2: cs106l ]
#style highlight v.1
```

##### Pointers

Pointers visualize an arrow from one section of memory to another. Use the special value `null` to represent `nullptr`. Otherwise, use `&[loc]` to draw an arrow to the memory at `loc`.


```memory
np = null
p = &x
x => 1 
```

There is no restriction on where pointers may originate from or point to, e.g. stack-stack, stack-heap, heap-heap etc.

```memory
x = 106
y = &x
z = &data[0]
data => [1,2,&strArr]
strArr ==> [ 0: &s1, 1: &s2, 2: &s3 ]
s1 ===> b"Welcome\0"
s2 ===> b"back to\0"
s3 ===> b"C!\0"

#style:link { endSocket: right, startSocketGravity: 10 } y
#style:link { path: straight } strArr.*
```

There is still a lot of work to do internally on getting pointer paths to render in a visually pleasing way. For now, you can make use of `#style:link` directives to get the right path options.

### Styling

To style the diagram, you can use a `#style` directive. The syntax is:

```c
#style        [cssClassOrObject] [loc ...]       // Styles a node's surrounding container
#style:name   [cssClassOrObject] [loc ...]       // For fields/variables, styles the name of the node
#style:row    [cssClassOrObject] [loc ...]       // For fields/variables, styles the entire name/value row
#style:value  [cssClassOrObject] [loc ...]       // Styles the innermost contents of a node
#style:link   [lineOptions]      [loc ...]       // Styles the arrow for a pointer
#style:label  [cssClassOrObject] [labelLoc ...]  // Styles a diagram label
```

`[cssClassOrObject]` is either a CSS classname or a JSON-esque object containing CSS properties. `[lineOptions]` are the [LeaderLine options](https://github.com/II-alex-II/leader-line-new?tab=readme-ov-file#options) for the arrow connecting a pointer to its pointee. `[labelLoc]` is the location of a label, e.g. `stack`, `heap`, `title`, `subtitle`, `=>`, `==>`, etc.

Note that you can use Python style array slicing, e.g.

```c
#style highlight data[2:10:2]
```

would highlight elements `[2, 10)`, skipping every other element. Negative indexes are allowed to refer to locations relative to the end of the array, e.g. `data[-1]`.

### Wide layout

To have an individual diagram occupy the width of the screen, use the `#layout wide` directive within that diagram. Diagrams by default will attempt to stack horizontally, wrapping if they become too wide.

### Labels

Use the label directive to custom diagram labels. All of the labels support multi-line markdown strings:

```c
#label title "**A title**"    // The title of the diagram
#label subtitle "A subtitle"  // The subtitle of the diagram
#label stack "Stack"          // The label of the stack section
#label heap "Heap"            // The label of all the heap sections
#label => "Heap"              // The label of a specific heap section
                              // Also works for ==>, ===>, etc.
```

Use an empty string to hide that label.

## Images

The `![alt text](url)` syntax can be used to show images. Placing a `*` in the `url` will expand to `light` or `dark`, depending on the current theme.

![An image that switches between light and dark mode](/graphics/iterators-*.svg)