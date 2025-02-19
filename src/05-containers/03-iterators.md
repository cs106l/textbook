---
title: Iterators
description: Iterators provide a uniform interface for traversing container data structures.
---

So far, we have covered a variety of C++ data structures&mdash;`std::map`, `std::vector`, `std::set`, `std::deque`, `std::unordered_map`, `std::unordered_set`&mdash;all of which have a variety of different implementations behind the scenes&mdash;binary search tree, contiguous allocation, array of arrays, hash table. Despite this internal complexity, we are still able to do certain operations on these containers without worrying about how they are implemented behind the scenes. For example, consider this code[^1]:

[^1]: In this snippet, we use `const auto&` for the container element. This is a recommended standard practice, as it (1) avoids making a copy of each element as you iterate (particularly important if the element type is large) and (2) prevents us from modifying the container element as we iterate (it is `const`). You can, however, write `auto elem : container` to copy each element if necessary or for primitive types where copying is not likely to be a performance concern (e.g. `int`, `float`, `double`, etc.).

```cpp
std::vector<int> container { 1, 2, 3 };

// The for loop below will still work if we had defined container as:
//
//    - std::deque<int> container;
//    - std::map<std::string, int> container;
//    - std::set<int> container;
//    - std::unordered_map<std::string, int> container;
 
for (const auto& elem : container) {
  // Do something with `elem`
}
```

How does this syntax work? Under the hood, the compiler does a syntactic transformation of the above code into the following:

```cpp
std::vector<int> container { 1, 2, 3 };

auto begin = std::begin(container);
auto end = std::end(container);

for (auto it = begin; begin != end; ++it) {
  const auto& elem = *it;
  // Do something with `elem`
}
```

What is `std::begin(container)`? What is `it`? As we will see, these are **iterators**, data types that share the same semantics as pointers and allow generic iteration over a data structure, independent of how that data structure was implemented.

## Iterator Basics

Imagine you want to iterate through every element in an `std::vector`. You might have code that looks like this:

```cpp
std::vector<std::string> strings { "Bjarne", "Stroustrup", "says" };

for (size_t i = 0; i < strings.size(); i++) {
  const auto& elem = strings[i];
  std::cout << elem << "\n";
}
```

This code uses an index `i` to keep track of which element the for loop is currently at. You have likely seen this code many times before, or something like it. Once `i` is no longer a valid index, we stop looping&mdash;otherwise, we increment `i` at the end of every iteration.

What if we wanted to apply the same kind of loop to an `std::set`? Recall from the previous chapter that unlike `std::vector`, `std::set` does not store its elements sequentially in memory. We cannot use an integer index to get an element from a set, since it also has no `operator[]`. What we'd like is some kind of construct that allows us to keep track of where we are in a container while iterating, but which can handle more powerful data structures than `std::vector`.

### Container Interface

Roughly speaking, an **iterator** functions as a pointer to an element in a container. The iterators of a container define a sequence of elements&mdash;each iterator knows how to get to the next iterator in the sequence. Every C++ container has built-in methods that return iterators to the beginning and end of its container. These methods are guaranteed to run in constant-time.

| Container Method | Description |
|--------|-------------|
| [`std::begin(c)`](https://en.cppreference.com/w/cpp/iterator/begin) <br /> `c.begin()` | Gets an iterator to the first element of a container |
| [`std::end(c)`](https://en.cppreference.com/w/cpp/iterator/end) <br /> `c.end()` | Gets an iterator to the **past-the-end** element of a container |

Note that `c.end()` is a *past-the-end* iterator&mdash;it doesn't actually point to any element of the container, but is instead one past the last element of the container. This helps us to build looping logic and represent empty containers. Consider the following set and its iterators:

```cpp
std::set<int> s { 1, 2, 3, 4, 5 };
auto begin = s.begin();
auto end = s.end();
```

```memory
#label heap "Elements"

s = &data
data => b"12345 "
begin = &data[0]
end = &data[5]

#style striped data[-1]
#style:link { path: straight } s
```

Note that an empty container has `c.begin()` and `c.end()` pointing to the same (non-existent) element:

```cpp
std::set<int> s;
auto begin = s.begin();
auto end = s.end();
```

```memory
#label heap "Elements"

s = &data
data => b" "
begin = &data[0]
end = &data[0]

#style striped data[-1]
#style:link { path: straight } s
```

### Iterator Interface

Iterators, on the other hand, all provide a simple set of operations to allow traversing through a container. Like the container methods, these are also required to run in constant-time.

| Iterator Method | Description |
|-----------------|-------------|
| `auto it = c.begin()` | **Copy Construction:** `operator=` creates a copy of an existing iterator that points to the same element. |
| `++it` **OR** `it++` | **Increment:** `operator++` moves the iterator forward onto the next element. |
| `it == c.end()` | **Comparison:** `operator==` determines whether two iterators point to the same element. |
| `*it` | **Indirection:** `operator*` returns a reference to the underlying element. Whether this reference can be read or written to depends on whether `it` is an input- or an output iterator (described below). |

> Be careful not to increment an iterator past the end (e.g. `++c.end()`) or try to dereference the end iterator (`*c.end()`). Both of these are undefined behaviour in C++!

Putting both the container and iterator interfaces together, try reasoning through what this code to iterate through a container is doing now:

```cpp
std::vector<int> container { 1, 2, 3 };

auto begin = std::begin(container);
auto end = std::end(container);

for (auto it = begin; begin != end; ++it) {
  const auto& elem = *it;
  // Do something with `elem`
}
```

If you have read and are familiar with [the chapter on pointers](/cpp-fundamentals/pointers-and-memory), you might notice that semantics of iterators are very similar to that of pointers. Iterators, like pointers, can be dereferenced, incremented, compared, etc. In some sense, iterators are a generalization of pointers to memory that is not necessarily sequential. This allows more complex data types, such as `unordered_map`, to seem *as if* its elements were represented sequentially in memory.

### Iterator Types

So far, we have used `auto` to let the compiler deduce the type of, for example, `c.begin()`. What actually is the type of an iterator? This will depend on the container, but generally speaking, given a container type `C`, its iterator type will be `C::iterator`. For example, `std::string::iterator` and `std::unordered_map<std:string, double>::iterator` are both iterator types.

Under the hood, these iterator types are implemented by the compiler internally for each data structure and type-aliased with a `using` definition inside of the container class. For example, consider one possible definition for a `std::vector`:

```cpp
template <typename T>
class std::vector {
public:
  using iterator = T*;
};
```

This code works because `std::vector` actually does store its elements sequentially in memory (through a heap allocated buffer) and pointers, as previously mentioned, share the basic semantics of iterators. A look behind the scenes for a more complex type like `std::unordered_map` might reveal a different implementation:

```cpp
template <typename K, typename V>
class std::unordered_map {
public:
  using iterator = _unordered_map_iterator<K, V>;
};

template <typename K, typename V>
struct _unordered_map_iterator {
  // Advance to the next element in the map
  void operator++();

  // Get access to the element associated with the iterator
  std::pair<const K, V>& operator*();
};
```

where `_unordered_map_iterator` is some internal, compiler-dependent type representing an iterator to an unordered map and which overloads all the necessary operations to meet the interface criteria for an iterator. `_unordered_map_iterator` is just an example&mdash;the actual type used will depend on the compiler.

## Iterator Categories

Not all iterators support the same set of operations. As a consequence of how their container is defined internally, some are more "powerful" than others. This is primarily a result of the restriction in the C++ Standard that all iterator methods be $O(1)$ in runtime complexity. For example, it is trivial to jump ahead by $n$ elements with a vector iterator in $O(1)$ time since a vector's memory is laid out sequentially, but not so straightforward to do so for an `std::unordered_map` whose elements are arranged in a distributed fashion. This gives rise to a variety of different **iterator categories**: each container's iterators fall into one of the following categories depending on what operations it supports.

![A diagram showing the difference between iterator categories](/graphics/iterators-*.svg)

### Output

An iterator is an **output iterator** if it supports overwriting the pointed to element via `operator=`, e.g.:

```cpp
*it = elem;
```

Some container iterators will not be output if modifying their element would require restructuring the container. For example, changing the key of an element in a `std::map` might change where that element lives in its binary-search tree, so `std::map<K, V>::iterator` is *not* output.

### Input

An iterator is an **input iterator** if it supports reading the pointed to element, e.g.:

```cpp
auto elem = *it;
```

Almost all iterators are input iterators&mdash;in fact, all of the following iterator categories are specializations of input iterators.

### Forward

Up to this point, we have not actually specified whether it is valid to make multiple passes over the iterators of a container. For example, given a range of elements between `begin` and `end` iterator, would it be valid to traverse these elements multiple times? 

```cpp
for (auto it = begin; it != end; ++it) {
  std::cout << *it << " ";
}

std::cout << "\n\n";

/* Are we allowed to run this for loop again with the same iterators? */
for (auto it = begin; it != end; ++it) {
  std::cout << *it << " ";
}
```

**Forward iterators** guarantee that multiple passes are valid. Every STL container's iterators are forward&mdash;intuitively, this should make sense: simply iterating over a container's elements doesn't change them in a way that would prevent iterating again. Outside of the STL containers, however, this is not generally true[^2].

[^2]: For example, consider `std::istream_iterator`, which allows us to iterate over the elements of an `istream`, as shown in the following example:

      ```cpp
      std::istringstream str("0.1 0.2 0.3 0.4");

      auto begin = std::istream_iterator<double>(str);
      auto end = std::istream_iterator<double>();

      for (auto it = begin; begin != end; ++it) {
        std::cout << *it << " ";
      }
      ```

      The above code reads doubles from the underlying `str` stream. Each time the iterator `it` is advanced, a `double` value is read from `str` and stored into `it`. We should not expect that running this for loop again (starting at `begin`) would yield the same output, since the stream has been modified! Hence, `std::istream_iterator` is not a forward iterator.

More formally, forward iterators must satisfy the *multi-pass guarantee*. That is, given iterators to a sequence `a` and `b`, it must hold that `++a == ++b`. In plain English, moving both iterators forward (in either order) should land them at the same element.

### Bidirectional

**Bidirectional iterators** are a kind of forward iterator that can be moved backwards as well as forwards, e.g.

```cpp
--it;
```

A container's iterators will be bidirectional if they are sequential in memory (like a vector) or if they are sorted (like a `std::map`). Some containers have no easy way to go backwards from an iterator (or choose not provide this behaviour) like `std::unordered_map`.

> Be careful not to decrement before the `begin` iterator! Writing `--c.begin()` is undefined behaviour, just like `++c.end()`.

### Random Access

A **random-access iterator** is a bidirectional iterator that supports jumping forwards or backwards multiple elements at a time through the sequence. 

```
auto it = c.begin() + n;
```

Negative values will move the iterator backwards. These iterators closely resemble pointers in their syntax. For example, we can use `operator[]` to combine an increment/dereference together:

```cpp
std::vector<int> v { 1, 2, 3 };
auto it = v.begin();
auto elem = it[2];      // Same as *(it + 2)
```

Once again, be careful not to go out of bounds or dereference the `end` iterator!

### Contiguous

**Contiguous iterators** are a subset of random-access iterators that further stipulate that their elements are stored contiguously in memory. For example, an `std::deque` is random-access, but not contiguous (recall its [implementation details](./sequence-containers#behind-the-scenes-1)).

Functionally, there is not much difference between this iterator and the one before it. However, taking the address of the elements pointed to by these iterators (`&*it`) will reveal that they are stored contiguously in memory.

## Iterator Invalidation

What happens to an iterator if we modify its underlying container? Iterators, much like pointers, point to a fixed location in memory where their element is stored, plus some bookkeeping data to derive the location of the next element. As a result, operations which restructure a container may **invalidate** previously obtained iterators. This can lead to undefined behaviour if we are not careful.

Here's a table sumarizing which operations will and will not invalidate iterators for the containers discussed in this textbook:

| Method | Is Valid? | Precondition |
|--------|-----------|-------|
| **`std::vector`** | | |
| `push_back` <br/> `insert` | ❌ | **`capacity()` changed.** If the vector had to reallocate its elements, then the elements will be copied over to a new buffer, invalidating all existing iterators. |
| `push_back` <br/> `insert` | ❌ | **Iterators after modified element.** These iterators will be pushed forward by one, so they will no longer refer to the same elements. |
| `push_back` <br/> `insert` | ✅ | **All other cases.** |
| `pop_back` <br/> `erase` | ❌ | **Iterators after modified element.** These iterators will be pushed backwards by one, so they will no longer refer to the same elements. | 
| `pop_back` <br/> `erase`  | ✅ | **All other cases.** |

## Iterator Flavors

### `const` Iterators

### Reverse Iterators

## Deep Dive: `std::deque::iterator`