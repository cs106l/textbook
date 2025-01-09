---
title: Initialization and References
description: How to construct and refer to instances of objects in memory.
---

## How to initialize objects?

To initialize an object is to provide it values at the time of construction. Everything in C++ has a constructor, which simply assigns it values at the time of the objects creation in a program.

There are three main methods of initialization we're going to discuss: direct initialization, uniform initialization, and structured binding.

## Direct initialization

This is the likely what you're familiar with if you're coming from a programming language like Python. Namely it looks something like this:

```cpp, runnable
int main() {
    `[int foo = 12.0;]` \\ equivalent to int foo(12.0)
    return 0;
}
```

the syntax uses a direct assignment with a `=`.

### Why do we need anything beyond direct initialization?
