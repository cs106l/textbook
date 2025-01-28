---
title: Associative Containers
description: Associative containers organize their elements in terms of unique keys.
---

Associative containers are collections that organize their elements in terms of unique keys. Conceptually, these resemble Python dictionaries and sets. Use `map` and `unordered_map` anytime you need to map from a unique key to a value, or `set` and `unordered_set` to store a collection of unique elements.

## Ordered Containers

Ordered associative containers impose an ordering on their element types, allowing them to accelerate key lookups.

### Requirements

To use an `std::map<K, V>` or a `std::set<T>`, `K` or `T` must have an `operator<`. For example,

```cpp
std::map<std::string, int> frequencies; 
```

would be valid because it is valid to compare two `std::string` using the `<` operator whereas:

```cpp
std::set<std::ifstream> streams;
```

would not be because there is no `operator<` defined for `std::ifstream`.

### `std::map<K, V>`

#### Common operations

#### Behind the scenes

### `std::set<T>`

#### Common operations

#### Behind the scenes

## Unordered Containers

### Requirements

### `std::unordered_map<K, V>`

#### Common operations

#### Behind the scenes

### `std::unordered_set<T>`

#### Common operations

#### Behind the scenes
