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

