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

would not be because there is no `operator<` defined for `std::ifstream`. If a type `MyType` lacks an `operator<`, you can still use it with a `map` or `set` as long as you can define one, which can be done in a number of ways:

1. **Define an `operator<`**. For example, one could write a <abbr title="A free-floating function defined outside of a class">non-member function</abbr> `operator<`, shown below. See the chapter on operator overloading for more details on how to overload the `operator<` function.

    ```cpp
    bool operator<(const MyType& a, const MyType& b) {
        // Return true if `a` is less than `b`
    }
    ```

2. **Define a <abbr title="An object that acts like a function by overloading the call operator, e.g. `operator()`">functor</abbr>**. This technique is recommended if you don't want to overload the global `operator<` for `MyType`. For example:

    ```cpp
    struct Less {
        bool operator()(const MyType& a, const MyType& b) {
            // Return true if `a` is less than `b`
        }
    }

    std::map<MyType, double, Less> my_map;
    std::set<MyType, Less> my_set; 
    ```

    This works by explicitly passing a comparison template argument to `map` and `set`, which if not provided as a template argument defaults to [`std::less<T>`](https://en.cppreference.com/w/cpp/utility/functional/less), a built-in functor in the standard library that compares keys using `operator<`!

3. **Use a lambda function.** Similar to the above, this is useful if you don't want to override the global `operator<`, and also avoids creating a new functor type. Functionally, it is the same as **2**:

    ```cpp
    auto comp = [](const MyType& a, const MyType& b){ 
        // Return true if `a` is less than `b`
    };

    std::map<MyType, double, decltype(comp)> my_map(comp);
    std::set<MyType, decltype(comp)> my_set(comp);
    ```

    `decltype(comp)` infers the compile-time type of the lambda function `comp`, which is ordinarily hidden through the use of `auto`. Note that we also pass the lambda function to the constructor of `map` and `set`.

### `std::map<K, V>`

A `map` is the standard way to associate a key with a value in C++. It works exactly like a Python dictionary or a JavaScript object, with a few exceptions noted below.

#### Common operations

| Expression | Result |
|-----------|--------|
| `std::map<K, V> m` | Creates an empty map. See [above](#requirements) for initializing a map with a custom comparison function |
| `std::map<K, V> m { { k1, v1 }, /* ... */ }` | Uniform initializes a map with key-value pairs `{k1, v1}`, `{k2, v2}`, etc. |
| `auto v = m[k]` | Gets the value for a key `k`. **If `k` is not in the map, it will be inserted with the default value for `V`. |
| `m[k] = v` | Sets or updates the value for a key `k`. |
| `auto v = m.at(k)` | Gets the value for a key `k`. Will throw an error if `k` is not present in the map. |
| `m.insert({ k, v })` <br /> `m.insert(p)` | Inserts an `std::pair p` (or the equivalent uniformly initialized pair using `k` and `v`) representing a key-value pair into the map **if it doesn't already exist** |
| `m.erase(k)` | Removes the key `k` from the map. `k` does not need to be present in the map. |
| `if (m.count(k)) ...` <br /> `if (m.contains(k)) ...` <sub>**(C++20)**</sub> | Checks if `k` is in the map. |
| `m.empty()` | Checks if `m` is empty |

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
