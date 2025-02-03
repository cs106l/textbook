---
title: Associative Containers
description: Associative containers organize their elements in terms of unique keys.
---

Associative containers are collections that organize their elements in terms of unique keys. Conceptually, these resemble Python dictionaries and sets. Use `map` and `unordered_map` anytime you need to map from a unique key to a value, or `set` and `unordered_set` to store a collection of unique elements.

## Ordered Containers

Ordered containers, `map` and `set`, impose an ordering constraint on their element types, allowing them to achieve key lookups in logarithmic time. Internally, these containers sort their elements using a comparison function. As a result, iterating through the key-value pairs of a map (or the elements of a set) will always produce them in order of smallest to largest key (or set element), as the following example demonstrates:

```cpp
#include <map>
#include <iostream>
#include <string>

int main() {
---
std::map<std::string, std::string> famous {
  { "Bjarne", "Stroustrup" },
  { "Herb", "Sutter" },
  { "Alexander", "Stepanov" }
};

for (const auto& [key, value] : famous) {
  std::cout << key << ": " << value << std::endl;
}

// Output (notice keys are sorted):
//  Alexander: Stepanov
//  Bjarne: Stroustrup
//  Herb: Sutter
---
}
```

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

| Expression | Result |
|-----------|--------|
| `std::map<K, V> m` | Creates an empty map. See [above](#requirements) for initializing a map with a custom comparison function |
| `std::map<K, V> m { { k1, v1 }, /* ... */ }` | Uniform initializes a map with key-value pairs `{k1, v1}`, `{k2, v2}`, etc. |
| `auto v = m[k]` | Gets the value for a key `k`. **If `k` is not in the map, it will be inserted with the default value for `V` |
| `m[k] = v` | Sets or updates the value for a key `k` |
| `auto v = m.at(k)` | Gets the value for a key `k`. Will throw an error if `k` is not present in the map |
| `m.insert({ k, v })` <br /> `m.insert(p)` | Inserts an `std::pair p` (or the equivalent uniformly initialized pair using `k` and `v`) representing a key-value pair into the map **if it doesn't already exist** |
| `m.erase(k)` | Removes the key `k` from the map. `k` does not need to be present in the map |
| `if (m.count(k)) ...` <br /> `if (m.contains(k)) ...` <sub>**(since C++20)**</sub> | Checks if `k` is in the map |
| `m.empty()` | Checks if `m` is empty |

> Pay special attention to the fact that `m[k]` will **insert a default initialized value into `m` if `k` does not exist!** The default value corresponds to the parameterless constructor of `V`. For example, `false` for `bool`, `0` for `int`, `size_t`, `float`, and `double`, and an empty container for most container types. This can lead to strange behaviour, such as keys appearing in a map even if all you did was try to read a value. For example, the following snippet:
> 
> ```cpp
> std::map<std::string, std::vector<int>> m;
> auto v = m["Bjarne"];
> std::cout << m.size() << std::endl;
> ```
>
> prints `1` even though this code appears to only read the value of `"Bjarne"` from the map. The reason for this behaviour is that it makes certain algorithms trivial to implement. For example, consider the following code which counts characters in a string:
>
> ```cpp
> std::string quote = "Peace if possible, truth at all costs";
> std::map<char, size_t> counts;
> for (char c : quote) {
>   counts[c]++; 
> }
> ```
>
> Compare this to the equivalent Python code, which might need to check for the existence of each character in the map before attempting to increment its count:
>
> ```python
> quote = "Peace if possible, truth at all costs"
> counts = {}
> for c in quote:
>   if c not in counts:
>     counts[c] = 0
>   counts[c] += 1
> ```
>
> In C++, the default-initialization of the value obviates this check!

### `std::set<T>`

A `set` is the standard way of storing a collection of unique elements in C++. No matter how many times you add the same element to a `set`, it's as if you only added it once.

| Expression | Result |
|-----------|--------|
| `std::set<T>` s | Creates an empty set |
| `s.insert(e)` | Adds `e` to `s`. Calling `insert(e)` more than once has the same effect as calling it once |
| `s.erase(e)` | Removes `e` from `s`. `e` does not need to be `s` |
| `if (s.count(e)) ...` <br /> `if (s.contains(e)) ...` <sub>**(since C++20)**</sub> | Checks if `e` is in the set |
| `s.empty()` | Checks if `s` is empty |

### Behind the scenes

You may be wondering: why do `std::map<K, V>` and `std::set<T>` impose the requirement that `K` and `T` have a `operator<`? The reason has to do with how these data structures are implemented behind the scenes. The ability to compare two elements allows us to build an efficient data structure that can quickly determine whether a key or value exists in a `map` or `set`.

The C++ standard does not enforce any particular implementation for the `map` and `set`, but compilers almost always implement these data structures with a [red-black tree](https://en.wikipedia.org/wiki/Red%E2%80%93black_tree), allowing for efficient traversal during key lookup. Let's see how this works for a `map` (`set` will behave similarly). Consider the following code snippet:

```cpp
std::map<std::string, size_t> m {
  { "Ludwig", 722 },
  { "Amadeus", 626 },
  { "Johann", 1128 },
  { "Gustav", 64 },
  { "Dmitri", 147 }
}; `[]`

auto gustav = m["Gustav"];
```

```memory
L1 {

  #label subtitle "The map organizes its elements in memory as a [binary search tree](https://en.wikipedia.org/wiki/Binary_search_tree). Each `TreeNode` has a `std::pair` containing the key and value for the node, and `left` and `right` pointers to the next node in the sequence. The tree is laid out in such a way as to make finding the node associated with a given key fast, as shown on the next line."

  m = "map<string, size_t>" { size: 5, root: &root }
  root => TreeNode { value: { first: Johann, second: 1128 }, left: &l, right: &r }

  l ==> TreeNode { value: { first: Dmitri, second: 147 }, left: &ll, right: &lr }
  r ==> TreeNode { value: { first: Ludwig, second: 722 }, left: null, right: null }

  ll ===> TreeNode { value: { first: Amadeus, second: 626 }, left: null, right: null }
  lr ===> TreeNode { value: { first: Gustav, second: 64 }, left: null, right: null }
}

L2 {

  #label subtitle "To find the value associated with a given key, the `map` traverses its tree using a binary search algorithm. Starting with the root node, it compares the desired key using the provided comparison function (`operator<` by default) to see which direction traversal should continue:
  
    - `\"Gustav\" < \"Johann\"`, so we go **left**
    - `\"Gustav\" >= \"Dmitri\"`, so we go **right**
    - `\"Gustav\"` is not less than itself, so we have found the node we were looking for!

  This is a simple example with five mappings, but imagine a tree with hundreds or thousands of mappings. Assuming our tree is well-balanced, each comparison we make would eliminates have of the nodes from consideration. 
  
  As you might expect, there is something special about the tree that allows this algorithm to work. Namely, all the keys in left subtree of a parent are less than the parent's key, and all of the keys in the right subtree are greater than the parent's key (this is what a binary search tree is). A `map` will perform better if its tree is roughly balanced—this is exactly what a [red black tree](https://en.wikipedia.org/wiki/Red-black_tree) (a specific kind of binary search tree) aims to accomplish.
  "

  m = "map<string, size_t>" { size: 5, root: &root }
  gustav = 64
  root => TreeNode { value: { first: Johann, second: 1128 }, left: &l, right: &r }

  l ==> TreeNode { value: { first: Dmitri, second: 147 }, left: &ll, right: &lr }
  r ==> TreeNode { value: { first: Ludwig, second: 722 }, left: null, right: null }

  ll ===> TreeNode { value: { first: Amadeus, second: 626 }, left: null, right: null }
  lr ===> TreeNode { value: { first: Gustav, second: 64 }, left: null, right: null }

  #style:link { dash: { animation: true } } m.root root.left l.right
  #style:link { opacity: 0.5 } root.right l.left
  #style { opacity: 0.5 } r ll
  #style:row highlight lr.value.second
}
```

A `set` uses the same red-black tree data structure under the hood to determine quickly determine if an element exists inside a set. `set` has no concept of a key-value pair, so its `TreeNode` behind the scenes is somewhat simpler: rather than storing a `pair` of key and value, it directly stores the set element in the node. Otherwise, `set` and `map` work exactly the same: conceptually, you can think of a `set` being somewhat like a `map` without any values.

## Unordered Containers

Unordered containers, `unordered_map` and `unordered_set`, perhaps more commonly known in other langauges as "hash tables", make use of hash and equality functions to achieve near constant-time key lookups. These containers are called *unordered* because, unlike `map` and `set`, they do not rely on an ordering comparison (e.g. `operator<`) to order their elements, and you cannot depend on their elements having any specific order when iterating through them. 

### Requirements

To use `std::unordered_map<K, V>` or `std::unordered_set<T>`, `K` or `T` must have an associated hash and equality function.

#### Hash function

A hash function "randomly" scrambles up an element of type `K` into a value of type `size_t`. When formally defined, hash functions are deterministic—the same `K` will always produce the same `size_t`—but they are discontinuous—small changes in the input `K` will produce large, unpredictable changes in the output `size_t`. These properties are key to how unordered data structures accelerate their element lookups.

Many types, e.g. `int`, `double`, `std::string`, have built-in hash functions (you can see the full list [here](https://en.cppreference.com/w/cpp/utility/hash)). Other seemingly basic types, such as `std::pair` and `std::tuple`, do not. To add a hash function to an unsupported type, do one of the following:

1. **Specialize the `std::hash` functor.** This is the most common way to add a hash function to a type. It involves creating a <abbr title="">template specialization</abbr> for the `std::hash<T>` functor, which is the default strategy unordered containers use to hash their elements. The syntax is as follows:

    ```cpp
    template<>
    struct std::hash<MyType>
    {
      std::size_t operator()(const MyType& o) const noexcept
      {
        // Calculate and return the hash of `o`...
      }
    };

    std::unordered_map<MyType, std::string> my_map;
    ```

2. **Define a custom functor.** This is an alternative to the above syntax if you do not want to change the default hash function for all consumers of a type. For example:

    ```cpp
    struct MyHash {
      std::size_t operator()(const MyType& o) const noexcept
      {
        // Calculate and return the hash of `o`...
      }
    };

    std::unordered_map<MyType, std::string, MyHash> my_map;
    ```

3. **Use a lambda function.** Similar to the above, this is useful if you don't want to override the global `operator<`, and also avoids creating a new functor type. Functionally, it is the same as **2**:

    ```cpp
    int main() {
    ---
    auto hash = [](const MyType& o) {
      // Calculate and return the hash of `o`...
    };

    /* The first number (10) is the starting number of buckets!
     * See the behind the scenes section for more information about buckets. */
    std::unordered_map<MyType, std::string, decltype(hash)> my_map(10, hash);
    std::unordered_set<MyType, decltype(hash)> my_set(10, hash);
    ---
    }
    ```

When writing your own hash functions, make sure that the output `size_t` are well distributed—as we will see, the performance of the container you use depends on how "random" its hash function outputs are. It is worthwhile to read [this Wikiedia article](https://en.wikipedia.org/wiki/Hash_function#Hashing_integer_data_types) for more information on how to design a good hash function. A good way to combine hash values, for example, is to utilize bit-shift, XOR, and multiplication by prime numbers, as the following example of a hash function for an `std::vector<T>` demonstrates. Preferrably, use a third-party library like [`boost::hash_combine`](https://www.boost.org/doc/libs/1_43_0/doc/html/hash/combine.html) to combine hash values in a way that yields a good distribution over the integers.

```cpp
template <typename T>
struct std::hash<std::vector<T>> {
  std::size_t operator()(const std::vector<T>& vec) const {
    std::size_t seed = vec.size();
    for (const auto& elem : vec) {
      size_t h = element_hash(elem);
      h = ((h >> 16) ^ h) * 0x45d9f3b;
      h = ((h >> 16) ^ h) * 0x45d9f3b;
      h = (h >> 16) ^ h;
      seed ^= h + 0x9e3779b9 + (seed << 6) + (seed >> 2);
    }
    return seed;
  }

  std::hash<T> element_hash{};
};
```

#### Equality function

The equality function (or key-equality function for `unordered_map`) checks if two elements/keys are equal. By default, `unordered_map` and `unordered_set` will try to use `operator==`. If your type is missing an `operator==`, you have a few options:

1. **Define an `operator==`**. See the chapter on operator overloading for more information.

    ```cpp
    bool operator==(const MyType& a, const MyType& b) {
        // Return true if `a` equals `b`
    }
    ```

2. **Define a functor**. This is recommended if you don't want to overload the global `operator==` for `MyType`. For example:

    ```cpp
    struct Equal {
        bool operator()(const MyType& a, const MyType& b) {
            // Return true if `a` equals `b`
        }
    }

    std::unordered_map<MyType, double, std::hash<MyType>, Equal> my_map;
    std::unordered_set<MyType, std::hash<MyType>, Equal> my_set; 
    ```

3. **Use a lambda function.** Similar to the above, this is useful if you don't want to override the global `operator<`, and also avoids creating a new functor type. Functionally, it is the same as **2**:

    ```cpp
    auto equals = [](const MyType& a, const MyType& b){ 
        // Return true if `a` equals `b`
    };

    std::unordered_map<MyType, double, std::hash<MyType>, decltype(equals)> my_map(10, {}, equals);
    std::unordered_set<MyType, std::hash<MyType>, decltype(equals)> my_set(10, {}, equals);
    ```

    Here, we are passing the default value for the hash function, `std::hash<T> {}`, to the container constructor, but any hash function can be used in practice.

### `std::unordered_map<K, V>`

`unordered_map` is an accelerated version of `map` that allows looking up the value for a key in constant time, at the cost of using additional memory.

`unordered_map` supports all of the operations of `std::map` (i.e. it can serve as a drop-in replacement for a `map`), as well as a few more operations specific to how it works [behind the scenes](#behind-the-scenes-1). Note that like `map`, the `operator[]` on `unordered_map` will default initialize values for keys which do not exist!

| Expression | Result |
|-----------|--------|
| `m.load_factor()` | Returns the current load factor (explained below) of the map |
| `m.max_load_factor(lf)` | Sets the maximum allowed load factor to `lf` | 
| `m.rehash(b)` | Ensures `m` has at least `b` buckets and reassigns elements to buckets given the new bucket count |

### `std::unordered_set<T>`

Similar to `unordered_map`, `unordered_set` is an accelerated version of `set` that allows checking set-membership in constant time. 

`unordered_set` supports all of the operations of `std::set`, as well as the [additional operations listed for `unordered_map`](#stdunordered_mapk-v).

### Behind the scenes

One of the performance bottlenecks of `map` and `set` is that to lookup an element, they must perform a binary search on their internal trees, taking $O(\log n)$ time. In most applications, this is acceptable, as $\log n$ even for very large $n$ is managable—even a `map` with one billion entries will only need to traverse $\log_2 10^9 \approx 30$ nodes to find a match in the worst case. However, if the overhead of this search is unacceptable, we can achieve faster lookup at the expense of higher memory usage by rearranging the way container elements are stored: this is exactly what `unordered_map` and `unordered_set` do.

Let's take a look at how `unordered_map` works (as we will see, `unordered_set` works identically). Like `std::map`, the C++ standard enforces no restrictions on what data structure `unordered_map` uses to organize its elements, but compilers almost always use a [**separate chaining hash table**](https://en.wikipedia.org/wiki/Hash_table#Separate_chaining)[^1]. The map picks some value $b$ (known as the bucket count) and keeps track of an array of $b$ linked lists, known as the buckets. On insertion, each key-value pair is placed into one of the $b$ buckets depending on the value of $b$ and the map's hash function. Specifically, if $f$ is the hash function, then a key $k$ will go into the bucket with index $f(k) \mod b$. Note that hash functions are not injective: there can exist keys $k_1\neq k_2$ for which $f(k_1)=f(k_2)$[^2], so more than one key can end up in the same bucket. After taking the modulo by $b$, the chance of such a <abbr title="When two different keys produce the same hash value, causing them to be stored in the same bucket and potentially requiring additional comparisons to distinguish them">hash collision</abbr> occuring increases even more as the output of $f$ is squashed to fit inside the range $[0, b)$.

To determine the value of a key $k$, the `unordered_map` first determines the bucket index of $k$ and then loops through the key-value pairs of that bucket, applying the key-equality function $e$ to each one until a matching key (and corresponding value) is found. Assuming that evaluating $f$ and $e$ is $O(1)$ (an assumption that is often made in practice), then the time complexity of a key lookup will depend on the number of elements the map must search through within each bucket before finding a matching key—in other words, the number of items in the bucket. On average, an `unordered_map` with $n$ mappings and $b$ buckets will have $\alpha=\frac{n}{b}$ items per bucket. This value, $\alpha$, is called the <abbr title="The ratio of the number of stored elements to the total number of buckets, indicating how full the hash table is. In general, lower values yield better performance">**load factor**</abbr> of the `unordered_map`. 

By keeping $\alpha$ small, the `unordered_map` will on average have to examine fewer items to find a key's value. In fact, `unordered_map` will keep this number bounded by some constant threshold: by default, the `max_load_factor` is set to `1.0`. Should the load factor exceed this threshold, the map will allocate additional buckets and <abbr title="The recomputing of the bucket indices and redistributing of existing elements to new buckets">**rehash**</abbr>. Because the map must search at most a constant $\alpha$ number of items during key lookup, key lookup in an `unordered_map` is considered $O(1)$. Let's take a look at an example and see what the `unordered_map` memory looks like:

```cpp
std::unordered_map<std::string, size_t> m {
  { "Ludwig", 722 },
  { "Amadeus", 626 },
  { "Johann", 1128 },
  { "Gustav", 64 },
  { "Dmitri", 147 }
}; `[]`

size_t amadeus = m["Amadeus"]; `[]`
m.insert({ "Franz", 600 }); `[]`
```

```memory
L1 {
  #label subtitle "Here we can see the map has chosen $b=5$, and maintains 5 buckets. By random chance, two key-value pairs have landed in bucket 0 and none in bucket 2. The value $b=5$ was chosen arbitrarily—in fact, it can be customized in the `unordered_map` constructor. The only requirement on $b$ is that it meets the load factor requirement: $\\frac{n}{b}=\\alpha\\leq 1.0$. In this case, $\\alpha=\\frac{5}{5}$, or exactly $1.0$."

  m = "unordered_map<string, size_t>" { b: 5, buckets: &buckets }
  buckets => [ 0: &b0, 1: &b1, 2: null, 3: &b3, 4: &b4 ]
  b0 ==> ListNode { value: { first: "Gustav", second: 64 }, next: &next }
  next ===> ListNode { value: { first: "Amadeus", second: 626 }, next: null }
  b1 ==> ListNode { value: { first: "Dmitri", second: 147 }, next: null }
  b3 ==> ListNode { value: { first: "Johann", second: 1128 }, next: null }
  b4 ==> ListNode { value: { first: "Ludwig", second: 722 }, next: null }

  #style:link { path: straight } buckets.*
}

L2 {
  #label subtitle "To find the value for `\"Amadeus\"`, lookup proceeds as follows. First we compute $f(\\texttt{\"Amadeus\"}) \\mod 5$ to find the bucket index (0). Then we loop through all key-value pairs in bucket 0 until we find the one which equals `\"Amadeus\"` according to the key-equality function. `\"Gustav\"` is skipped.
  
  **Note:** Even if bucket 0 had only a single element, we would still need to loop through its elements and apply the key-equality function, since it might happen to have a single key that coincidentally has the same bucket index as `\"Amadeus\"`."

  m = "unordered_map<string, size_t>" { b: 5, buckets: &buckets }
  amadeus = 626

  buckets => [ 0: &b0, 1: &b1, 2: null, 3: &b3, 4: &b4 ]
  b0 ==> ListNode { value: { first: "Gustav", second: 64 }, next: &next }
  next ===> ListNode { value: { first: "Amadeus", second: 626 }, next: null }
  b1 ==> ListNode { value: { first: "Dmitri", second: 147 }, next: null }
  b3 ==> ListNode { value: { first: "Johann", second: 1128 }, next: null }
  b4 ==> ListNode { value: { first: "Ludwig", second: 722 }, next: null }

  #style { opacity: 0.5 } b1 b3 b4 buckets.1 buckets.2 buckets.3 buckets.4
  #style:link { opacity: 0.5 } buckets.1 buckets.2 buckets.3 buckets.4
  #style:link { dash: { animation: true }} m.buckets buckets.0 b0.next

  #style:row { backgroundColor: "var(--palette-error-light)" } b0.value.first
  #style:row { backgroundColor: "var(--palette-success-light)" } next.value.first

  #style:link { path: straight } buckets.*
}

L3 {
  #label subtitle "After inserting the key-value pair `{ \"Franz\", 600 }` to the map, the resulting load factor was $\\alpha=\\frac{6}{5}=1.2 \\not \\leq 1.0$. Because $\\alpha$ exceeded the threshold of $1.0$, the map had to allocate more buckets and rehash. To choose the new bucket count, the old bucket count is typically doubled. Some compilers, such as G++ in this example, will further stipulate that the new bucket count always be a prime number, as taking the modulo by this count gives a better distribution of items over the buckets (11 is used in this example). Notice that after rehashing, the relative arrangement of items has completely changed as a result of the new bucket count."

  m = "unordered_map<string, size_t>" { b: 11, buckets: &buckets }
  amadeus = 626

  buckets => [ 0: null, 1: null, 2: &b2, 3: &b3, 4: null, 5: null, 6: null, 7: &b7, 8: null, 9: &b9, 10: &b10 ]

  b2  ==> ListNode { value: { first: "Dmitri", second: 147 }, next: &next }
  b3  ==> ListNode { value: { first: "Ludwig", second: 722 }, next: null }
  b7  ==> ListNode { value: { first: "Amadeus", second: 626 }, next: null }
  b9  ==> ListNode { value: { first: "Gustav", second: 64 }, next: null }
  b10 ==> ListNode { value: { first: "Franz", second: 600 }, next: null }
  next ===> ListNode { value: { first: "Johann", second: 1128 }, next: null }

  #style:link { path: straight } buckets.*
}
```

As was the case for `set`, `unordered_set` uses the same hash-table data structure as `unordered_map`. You can think of `unordered_set` as being implemented as a hash-table whose nodes contain only the elements (as opposed to key-value pairs).

[^1]: Other hashing strategies exist, such as open addressing, but separate chaining is used in practice due to certain time complexity restrictions guaranteed by methods of `unordered_map` and `unordered_set` in the C++ standard.

[^2]: One intuitive way to make sense of this fact is to consider the hash function for a `std::string`. Intuitively, there are many more possible `std::string` instances than `size_t`, so there must be at least two `std::string` instances with the same hash value.

## Which should I use?

A perennial question among C++ developers is: given the choice between a `map` and an `unordered_map`, which one should I choose? The answer to this question will depend on the specific problem you are solving and what your requirements are. As a general rule of thumb, `unordered_map` will offer superior performance over `map` while using far more memory (at the very least, a lot of empty buckets are needed to keep the load factor small). In general, as memory tends to be less of a concern in software development, `unordered_map` seems to be the more promising choice. However, in select circumstances `map` can still outperform `unordered_map`. Below is a (far from an exhaustive) table of where each container type shines:

| Scenario | Ordered Container (`map`/`set`) | Unordered Container (`unordered_map`/`unordered_set`) |
|----------|---------------------------------|-------------------------------------------------------|
| **Ordering** | ✔️ Allows iteration of keys/element in sorted order | ❌ Has no dependable order. Elements are iterated in an essentially random order |
| **Speed** | ❌ Finding/removing an element requires a binary tree traversal, average $O(\log n)$ | ✔️ Hash functions allows near constant-time element lookup and removal, average $O(1)$ |
| **Memory** | ✔️ Small memory footprint, including only the element data and bookkeeping data for binary search tree | ❌ Large memory footprint, must allocate many empty buckets in order to keep load factor small |
| **Element operations** | ✔️ Comparing elements using `operator<` is usually faster, since `operator<` often only needs to examine part of its operands to determine that one is smaller | ❌ Must invoke hash function, which must inspect the entire key object, and equality function |
| **Worst-case lookup** | ✔️ Looking up an element takes at most $O(\log n)$, requiring a tree traversal | ❌ Looking up an element takes at most $O(n)$, e.g. if poor choice of hash function places all elements in the same bucket |
| **Worst-case resize** | ✔️ Adding elements is always $O(\log n)$ in the worst case, requiring a tree traversal | ❌ Adding elements may trigger a rehash, taking $O(n^2)$ in the worst case | 
| **[Working set](https://en.wikipedia.org/wiki/Working_set)**[^3] | ✔️ Tends to preserve its working set, i.e. the same set of nodes are frequently accessed during lookups, even as the container resizes | ❌ Rehashing essentially produces a new working set. After rehashing, the buckets are completely rearranged, causing cache lines that were previously hot to become cold and vice-versa.

[^3]: The working set of a program is the set of locations in memory it frequently accesses. For reasons that are beyond the scope of this textbook, low-latency applications benefit from having a working set that doesn't change much. Accessing the same addresses frequently is usually faster than accessing many different locations, which can happen, for example, when an `unordered_map` has to rehash.

