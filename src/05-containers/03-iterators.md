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

where `_unordered_map_iterator` is some internal, compiler-dependent type representing an iterator to an unordered map and which overloads all the necessary operations to meet the interface criteria for an iterator.

## Iterator Categories

Not all iterators support the same set of operations. As a consequence of how their container is defined internally, some are more "powerful" than others. This is primarily a result of the restriction in the C++ Standard that all iterator methods be $O(1)$ in runtime complexity. For example, it is trivial to jump ahead by $n$ elements with a vector iterator in $O(1)$ time since a vector's memory is laid out sequentially, but not so straightforward to do so for an `std::unordered_map` whose elements are arranged in a distributed fashion. This gives rise to a variety of different **iterator categories**: each container's iterators fall into one of the following categories depending on what operations it supports.

### Output

### Input

### Forward

### Bidirectional

### Random Access

### Contiguous

## Iterator Flavors

### `const` Iterators

### Reverse Iterators

## Iterator Invalidation

## Deep Dive: `std::deque::iterator`