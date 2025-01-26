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
| `v.pop_back()` | Removes the last element of `v`, which must not be empty. **Note: This method does not return the element, it merely removes it** |
| `v.empty()` | Returns whether `v` is empty |
| `T e = v[i]` <br /> `v[i] = e` | Reads or writes to the element at index `i`. **Does not perform bounds checking** |
| `T e = v.at(i)` <br /> `v.at(i) = e` | Reads or writes to the element at index `i`. **Throws an error if `i` is out of bounds** |
| `v.clear()` | Empties `v` |

> Pay special attention to `v[i]`, which does not perform bounds checking on the vector. Attempting to index out of bounds results in <abbr title="Any attempt to execute code that violates the language's rules or assumptions, leading to unpredictable outcomes ranging from program crashes to seemingly correct behavior">**undefined behaviour**</abbr>: simply put, your program may crash or silently continue in a seemingly random fashion.
>
> The reason for this is that `v[i]` is an extremely common operation. Assuming that we write correct code, we should never attempt to access out-of-bounds elements. Checking if `i` is in-bounds would incur a small and unnecessary performance penalty which would be undesirable in performance-sensitive applications. If we need the extra peace-of-mind, however, we can opt into this by using the otherwise equivalent `v.at(i)`.

### Behind the scenes

At any point in time, `std::vector` manages a single block of memory large enough to hold all of its elements, and allocates a new block of memory (and frees the old one) when it requires more space. For example, consider this block of code:

```cpp
std::vector<int> v { 1, 2, 3, 4 }; `[]`
v.push_back(5); `[]`
v.push_back(6); `[]`
```

```memory
L1 {
  #label subtitle "`v` has a capacity of `5`. In actual practice, the starting capacity of a vector will depend on the compiler."
  v = "vector<int>" { size: 4, capacity: 5, data: &data }
  data => b"1234_"
}

L2 {
  #label subtitle "`v` has enough remaining capacity to insert `5`, so it gets inserted into `data` at the end of the vector"
  v = "vector<int>" { size: 5, capacity: 5, data: &data }
  data => b"12345"
  #style highlight data[4]
}

L3 {
  #label subtitle "`v` has run out of space, so it allocates a new block of memory on the heap, copies its elements, and deallocates the old block of memory. Typically, vectors will double their capacity on reallocation, but the actual behaviour is compiler dependent."
  v = "vector<int>" { size: 6, capacity: 10, data: &data }
  old => b"12345"
  data => b"123456____"
  #style { opacity: 0.5 } old
  #style highlight data[5]
}
```

## `std::deque<T>`

An `std::deque<T>` (pronounced "deck") represents a double-ended queue of elements that supports efficient insertion/removal at both the front and back of the container.

### Motivation

Sometimes using an `std::vector<T>` is just not fast enough. Suppose that you are working for an algorithmic finance company, and you must keep track of the last $100,000$ movements of a stock price that changes rapidly. Every time the price changes, you call the `receive_price` function with the latest price. Naturally, you decide to use an `std::vector<T>` to store the prices:

```cpp
void receive_price(std::vector<double>& prices, double price) {
  prices.push_front(price);
  if (prices.size() > 100000)
    prices.pop_back();
}
```

This code as it's written wouldn't compile, since `std::vector<T>` doesn't have a `push_front` method. But let's imagine that it did:

```cpp
void std::vector<T>::push_front(const T& value) {
  resize(size() + 1); `[]`
  for (size_t i = size() - 1; i > 0; --i) `[]`
    (*this)[i] = (*this)[i - 1];
  (*this)[0] = value; `[]`
}
```

`L1` ensures the vector has extra space for the element, the loop at `L2` moves every element in the vector forward by one, and finally `L3` inserts the new value at the beginning of the vector.

You try deploying the `receive_price` function to track price changes and... you observe a massive spike in latency. The code simply takes too long to run! You speculate that it has something to do with the way `push_front` works, specifically the `for` loop at `L2` which must shift all the elements forward by one. In fact, this is exactly the reason why C++ doesn't natively support a `push_front` method: if it were to exist, it would be egregiously slow.

### A performant alternative

As it turns out, if you need to support efficient insertion at the front of a sequence container, `std::vector<T>` is just not the right tool for the job. This is a consequence of how `std::vector<T>` is implemented: since it maintains a single contiguous chunk of memory at all times, attempting to insert at the front requires advancing every element forward to make space for the new one.

`std::deque<T>` solves this problem by laying out its elements in a slightly different way that is more amenable to front-insertion. In our `receive_price` function, we can use an `std::deque<double>` instead:

```cpp
void receive_price(`[std::deque<double>& prices]`, double price) {
  prices.push_front(price);
  if (prices.size() > 100000)
    prices.pop_back();
}
```

Now, the code not only compiles, but is lightning fast!

### Common operations

`std::deque<T>`, despite being a "double-ended queue", is still a sequence container. In fact, it supports all of the operations that `std::vector<T>` supports, plus a few more:

| Expression | Result |
|------------|--------|
| `d.push_front(e)` | Appends `e` to the front of the `d`. |
| `d.pop_front()` | Removes the first element of `d`, which must not be empty. **Note: This method does not return the element, it merely removes it** |


### Behind the scenes

The issue with `std::vector<T>` was its use of a single allocation: all of the elements must move after the point of insertion. `std::deque<T>` solves this by splitting up the allocation into multiple fixed-size allocations. To keep track of where the in-use region begins and ends, `std::dequeu<T>` uses a `begin` and `finish` index (in reality, these are <abbr title="An abstraction enabling traversal of container elements sequentially without exposing the underlying data structure">iterators</abbr>, which are discussed in a later chapter, not indexes as shown below). Consider the following example:

```cpp
std::deque<int> d { 4, 5, 6, 7, 8, 9 }; `[]`
d.push_front(3); `[]`
d.push_front(2); `[]`
d.push_front(1);
d.push_front(0);
d.push_front(-1);
d.push_front(-2); `[]`
```

```memory
L1 {
  #label subtitle "Let's suppose this was the memory layout for the initial elements. Two fixed size blocks of size `4` have been allocated (the actual size and number of blocks allocated will depend on the compiler). Notice that `start` and `finish` refer to indexes across *all* blocks. `blocks` is an array of arrays, and `capacity` refers to the size of that array."

  d = "deque<int>" { start: 1, finish: 6, blocks: &blocks, capacity: 2 }
  blocks => "blocks" [ 0: &b0, 1: &b1 ]
  b0 ==> b"_456"
  b1 ==> b"789_"
}

L2 {
  #label subtitle "When we invoke `d.push_front(3)`, the deque first checks if there is space available at the front of the first in-use chunk of the deque. In this case there is, so the element gets placed there. Notice that `start` has been updated to `0` to reflect this."

  d = "deque<int>" { start: 0, finish: 6, blocks: &blocks, capacity: 2 }
  blocks => "blocks" [ 0: &b0, 1: &b1 ]
  b0 ==> b"3456"
  b1 ==> b"789_"

  #style highlight b0[0]
}

L3 {
  #label subtitle "The first in-use block has run out of space, so we must allocate a new one. However, we must keep track of pointer to the newly allocated block in `blocks`, which has also run out of space. Similarly to how a `std::vector` doubles its element array on resizing, `deque` will do a similar thing with the `blocks` array. Once `blocks` has been resized (copying over the old pointers and then deallocating the old `blocks` array), a new block is allocated to store `2`.
  
  Notice that `start` and `finish` in this example are relative to the beginning of the `blocks` array **as if** it were completely filled. Blocks are allocated on demand, so the first block in this example is unallocated and stored as `nullptr` in the `blocks` array."

  d = "deque<int>" { start: 7, finish: 14, blocks: &blocks, capacity: 4 }
  old => "blocks" [ 0: &b2, 1: &b3 ]
  blocks => "blocks" [ 0: null, 1: &b1, 2: &b2, 3: &b3 ]
  b1 ==> b"___2"
  b2 ==> b"3456"
  b3 ==> b"789_"

  #style highlight b1[3]
  #style { opacity: 0.5 } old
  #style:link { opacity: 0.25 } old.*
}

L4 {
  #label subtitle "The first in-use block runs out of space after pushing `1`, `0`, and `-1`, so in order to execute `d.push_front(-3)`, a new block is allocated on demand to store `-3` and added to the `blocks` array."

  d = "deque<int>" { start: 3, finish: 14, blocks: &blocks, capacity: 4 }
  blocks => "blocks" [ 0: &b0, 1: &b1, 2: &b2, 3: &b3 ]
  b0 ==> [_, _, _, -3]
  b1 ==> [-1, 0, 1, 2]
  b2 ==> b"3456"
  b3 ==> b"789_"

  #style highlight b0[3]
}
```

An astute reader may wonder: if an `std::deque<T>` must double its `blocks` array (as shown at `L3` above) when it runs out of space, how is this more performant than an `std::vector<T>`? In practice, the size of each block in a deque will range from several hundred to several thousand elements, depending on the type `T`. This effectively means that resizing the `blocks` array is hundreds to thousands of times faster than resizing the `data` array in a vector.

Despite splitting elements up across multiple allocations, `std::deque<T>` still supports getting elements by index, just like an `std::vector<T>`. In this example, to get `d[i]`, one could look at the block in `blocks` at index `(start + i) / 4` (using integer division), and then index `(start + i) % 4` within that block. In actual practice, `start` and `finish` effectively store pointers directly to the first and last elements in the deque and so the implementation details may differ, but the same principles apply.

As a result, indexing into an `std::deque<T>` is slightly slower than an `std::vector<T>`, since it must follow two pointers (as opposed to one) to find an element. While a deque is more powerful than a vector in the sense that it supports all the operations of a vector and more, **a vector should still be preferred over a deque** unless your use-case requires efficient front insertion/removal.