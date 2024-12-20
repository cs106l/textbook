---
title: Introduction
description: The introduction to the course reader!
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

Here is a syntax highlighted code block:

```cpp
int main() {
  std::cout << "Hello world!" << std::endl;
  return 0;
}
```

Here is an editable syntax highlighted code block. These will ultimately be runnable segments with a `Run` button attached:

```cpp,runnable
int main() {
  std::cout << "Hello world!" << std::endl;
  return 0;
}
```

You can initially focus on a section of the code segment by surrounding it with `!!!` lines:

```cpp,runnable
int main() {
!!!
std::cout << "Hello world!" << std::endl;
return 0;
!!!
}
```

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