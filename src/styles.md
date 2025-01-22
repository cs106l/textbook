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
vec = Vector<int>{size: 4, capacity: 10, data: &data}
data => b"1234______"

#style data[:4] highlight { fontWeight: bold }
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

  #style data[:6] highlight
  #style link:cin { dash: { animation: true } }
  #style name:cin { color: "red" }
}

L2 {
  #label subtitle "This one has a *red* subtitle."

  main:
  foo = &data
  data => [1,2,3]

  #style label:subtitle { color: red }
}

L3 {
  x = 1
  foo:
  y = 2 
}
```

Note how in the above, placing a diagram immediately below a code block causes the two to appear merged together.

### Styling

To style the diagram, you can use a `#style` directive. The syntax is:

```c
#style [loc] [cssClassOrObject ...]         // Styles a node's surrounding container
#style name:[loc] [cssClassOrObject ...]    // For fields/variables, styles the name of the node
#style row:[loc] [cssClassOrObject ...]     // For fields/variables, styles the entire name/value row
#style value:[loc] [cssClassOrObject ...]   // Styles the innermost contents of a node
#style link:[loc] [lineOptions]             // Styles the arrow for a pointer
```

`cssClassOrObject` is either a CSS classname or a JSON-esque object containing CSS properties. `lineOptions` are the [LeaderLine options](https://github.com/II-alex-II/leader-line-new?tab=readme-ov-file#options) for the arrow connecting a pointer to its pointee.

Note that you can use Python style array slicing, e.g.

```c
#style data[2:10:2] highlight
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
#label heap "Heap"            // The label of the heap section
```

Use an empty string to hide that label.

You can style a label using the `#style label` directive, which works similarly to [styling a node](#styling)

```c
#style label:subtitle [cssClassOrObject ...] 
```
