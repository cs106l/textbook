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

```memory
d1 {
  #label stack "Stream"
  #label heap ""

  cin("std::cin") = &data[6]  
  data => b"Bjarne Stroustrup"

  #style data[:6] highlight
  #style link:cin { dash: { animation: true } }
  #style label:cin { color: "red" }
}

d2 {
  main:
  foo = &data
  data => [1,2,3]
}
```