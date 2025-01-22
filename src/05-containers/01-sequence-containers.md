---
title: Sequence Containers
description: Sequence containers are linear collections of elements
---

Sequence containers are linear collections of elements. Conceptually, these are the equivalent of lists in other languages: `list` in Python or `ArrayList` in Java.

## `std::vector<T>`

The most common kind of sequence container—indeed, probably the most common container type—is `std::vector<T>` which represents a list of elements of a type `T`.

### Common operations

| Expression | Result |
|-----------|--------|
| `std::vector<T> v` | Creates an empty vector. |
| `std::vector<T> v(n)` | Creates a vector with `n` copies of the default value of type `T` |
| `std::vector<T> v(n, e)` | Creates a vector with `n` copies of value `e` |
| `v.push_back(e)` | Appends `e` to the end of `v` |
| `v.empty()` | Returns whether `v` is empty |
| `T e = v[i]` <br /> `v[i] = e` | Reads or writes to the element at index `i`. **Does not perform bounds checking.** |
| `T e = v.at(i)` <br /> `v.at(i) = e` | Reads or writes to the element at index `i`. **Throws an error if `i` is out of bounds.** |
| `v.clear()` | Empties `v`. |

> Pay special attention to `v[i]`, which does not perform bounds checking on the vector. Attempting to index out of bounds results in <abbr title="Any attempt to execute code that violates the language's rules or assumptions, leading to unpredictable outcomes ranging from program crashes to seemingly correct behavior">**undefined behaviour**</abbr>: simply put, your program may crash or silently continue in a seemingly random fashion.
>
> The reason for this is that `v[i]` is an extremely common operation. Assuming that we write correct code, we should never attempt to access out-of-bounds elements. Checking if `i` is in-bounds would incur a small and unnecessary performance penalty which would be undesirable in performance-sensitive applications. If we need the extra peace-of-mind, however, we can opt into this by using the otherwise equivalent `v.at(i)`.

### How it works

At any point in time, `std::vector` manages a single block of memory large enough to hold all of its elements, and allocates a new block of memory (and frees the old one) when it requires more space. For example, consider this block of code:

```cpp
std::vector<int> v { 1, 2, 3, 4 }; `[]`
v.push_back(5); `[]`
v.push_back(6); `[]`
```

```memory
L1 {
  #label subtitle "`v` has a capacity of `5`. In actual practice, the starting capacity of a vector will depend on the compiler."
  v = vector<int>{ size: 4, capacity: 5, data: &data }
  data => b"1234_"
}

L2 {
  #label subtitle "`v` has enough remaining capacity to insert `5`, so it gets inserted into `data` at the end of the vector"
  v = vector<int>{ size: 5, capacity: 5, data: &data }
  data => b"12345"
  #style highlight data[4]
}

L3 {
  #label subtitle "`v` has run out of space, so it allocates a new block of memory on the heap, copies its elements, and deallocates the old block of memory. Typically, vectors will double their capacity on reallocation, but this is compiler dependent."
  v = vector<int>{ size: 6, capacity: 10, data: &data }
  old => b"12345"
  data => b"123456____"
  #style { opacity: 0.5 } old
  #style highlight data[5]
}
```