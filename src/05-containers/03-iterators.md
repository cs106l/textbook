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

Roughly speaking, an **iterator** is like a pointer to an element in a container. Every C++ container has built-in methods that return iterators to the beginning and end of its container. 

## Iterator Categories

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