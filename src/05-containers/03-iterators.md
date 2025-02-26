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

What if we wanted to apply the same kind of loop to an `std::set`? Recall from the previous chapter that unlike `std::vector`, `std::set` does not store its elements sequentially in memory. We also cannot use an integer index to get an element from a set, since it has no `operator[]`. What we'd like is some kind of construct that allows us to keep track of where we are in a container while iterating, but which can handle more powerful data structures than `std::vector`.

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

If you have read and are familiar with [the chapter on pointers](/cpp-fundamentals/pointers-and-memory), you might notice that semantics of iterators are very similar to that of pointers. Iterators, like pointers, can be dereferenced, incremented, compared, etc. In some sense, iterators are a generalization of pointers to memory that is not necessarily sequential. This allows more complex data types, such as `unordered_map`, to seem *as if* their elements are represented sequentially in memory.

> **Note:** You may notice in this chapter that we use `++it` instead of `it++` when incrementing iterators. To see why, it can help to look at the call signatures of these two versions and how they differ:
>
> ```cpp
> /** The prefix form, e.g. ++it */
> Iterator& operator++() {
>   /*
>    * Code that moves this iterator to the next element
>    */
>   return *this;
> }
>
> /** The postfix form, e.g. it++
>  *
>  * Note the `int` in the signature exists only to differentiate
>  * from the above method. 
>  */
> Iterator operator++(int) {
>   Iterator prev = *this;    // Save a copy the iterator's current state
>   ++*this;                  // Move the iterator forward using the prefix form above
>   return prev;              // Return the **old** state!
> }
> ``` 
>
> In particular, the prefix form (`++it`) updates an iterator in-place, returning a reference to the same iterator. The postfix form (`it++`) still updates the iterator, but **returns a copy of the old value of the iterator before it was incremented.** For this reason, `it++` can be a bit slower than `++it` because an extra copy is created[^6].

[^6]: In actual practice, the extra copy created by `it++` may be optimized out by the compiler if it is not used, so these two versions may end up exhibiting the same performance after all optimizations are applied. We encourage you to check out [this FAQ post](https://isocpp.org/wiki/faq/operator-overloading#increment-pre-post-speed) on the isocpp site (co-authored by the original creator of C++) which states:

      > So if you’re writing `i++` as a statement rather than as part of a larger expression, why not just write `++i` instead? You never lose anything, and you sometimes gain something.

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

| Supported Operation | Description |
|-----------------|-------------|
| `*it = elem` | **Overwriting element:** `operator*` returns a reference whose value can be overwritten, changing the value of the element the iterator points to. |

### Input

An iterator is an **input iterator** if it supports reading the pointed to element, e.g.:

```cpp
auto elem = *it;
```

Almost all iterators are input iterators[^3]&mdash;in fact, all of the following iterator categories are specializations of input iterators.

| Supported Operation | Description |
|-----------------|-------------|
| `auto elem = *it` | **Reading element:** `operator*` returns a reference which represents the element pointed to by the iterator. |

[^3]: One example of an iterator which is not an input iterator is [`std::ostream_iterator`](https://en.cppreference.com/w/cpp/iterator/ostream_iterator). This iterator represents a position inside an `std::ostream`, and allows inserting elements into an `ostream` (but not reading them). For example, the following code writes comma-separated `double` values to `std::out`:

      ```cpp
      std::ostream_iterator<double> it(std::cout, ", ");
      *it = 3.14;
      ++it;
      *it = 1.62;
      ++it;

      // Output:
      //  3.14, 1.62, 
      ```

      This code allows us to write to an `std::ostream` through an iterator interface. To do this, it employs some operator overloading trickery. For one, `operator*` returns a reference to the same iterator. That is, `operator*` is implemented as:

      ```cpp
      std::ostream_iterator& operator*() { return *this; }
      ```

      Meanwhile, `operator=` is overloaded to write elements to the underlying stream, e.g.

      ```cpp
      std::ostream_iterator& operator=(const T& value) {
        *out_stream << value;
        if (delim != 0)
            *out_stream << delim;
        return *this;
      }
      ```

      where `std::ostream& out_stream` and `const char* delim` are private fields of the iterator, assigned on construction. Together, these overloads allow code like `*it = 3.14` to write to the underlying stream. Notice that *reading* the value of `*it` is meaningless&mdash;`std::ostream_iterator` is not an input iterator. `*it` is simply a reference to the same iterator and doesn't actually refer to any "element" in the stream.

      This is also the way that the commonly used [`std::back_inserter`](https://en.cppreference.com/w/cpp/iterator/back_inserter), [`std::front_inserter`](https://en.cppreference.com/w/cpp/iterator/front_inserter) and [`std::inserter`](https://en.cppreference.com/w/cpp/iterator/inserter) work as well.

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

More formally, forward iterators must satisfy the *multi-pass guarantee*. That is, given iterators `a` and `b` which point to the same element (`a == b`), it must hold that `++a == ++b`. In plain English, moving both iterators forward (in either order) should land them at the same element.

### Bidirectional

**Bidirectional iterators** are a kind of forward iterator that can be moved backwards as well as forwards, e.g.

```cpp
--it;
```

A container's iterators will be bidirectional if there is some way to identify the previous element. This may be the case if the container is sequential (like a vector) or its elements are sorted (like a `std::map`). Some containers have no easy way to go backwards from an iterator (or choose not provide this behaviour) like `std::unordered_map`.

> Be careful not to decrement before the `begin` iterator! Writing `--c.begin()` is undefined behaviour, just like `++c.end()`.

| Supported Operation | Description |
|-----------------|-------------|
| `--it` **OR** `it--` | **Decrement:** `operator--` moves the iterator backwards to the previous element. |

### Random Access

A **random-access iterator** is a bidirectional iterator that supports jumping forwards or backwards multiple elements at a time. 

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

| Supported Operation | Description |
|-----------------|-------------|
| `it += n` | **Random Access:** If $n$ is positive, `operator+=` moves `it` forward `n` hops&mdash;this has the equivalent effect as calling `it++` $n$ times except the operation is done in constant time. For negative $n$, `operator+=` moves `it` backwards. |
| `it -= n` | **Random Access:** Identical to `it += -n` |
| `it + n` | **Random Access:** Creates a new iterator `n` hops forward |
| `it - n` | **Random Access:** Creates a new iterator `n` hops backward |
| `it1 < it2` <br /> `it1 <= it2` <br /> `it1 > it2` <br /> `it1 >= it2` | **Ordered Comparison:** Checks if `it1` comes before or after, respectively, `it2` in the sequence |

### Contiguous

**Contiguous iterators** are a subset of random-access iterators that further stipulate that their elements are stored contiguously in memory. For example, an `std::deque` is random-access, but not contiguous (recall its [implementation details](./sequence-containers#behind-the-scenes-1)).

Functionally, there is not much difference between contiguous and random-access iterators. However, taking the address of the elements pointed to by these iterators (`&*it`) will reveal that they are stored contiguously in memory.

## Iterator Invalidation

What happens to an iterator if we modify its underlying container? Iterators, much like pointers, point to a fixed location in memory where their element is stored, plus some bookkeeping data to derive the location of the next element. As a result, operations which restructure a container may **invalidate** previously obtained iterators. This can lead to undefined behaviour if we are not careful.

Here's a table sumarizing which operations will and will not invalidate iterators for the containers discussed in this textbook:

| Method | Iterators Valid? | Precondition/Notes |
|--------|-----------|-------|
| **`std::vector`** |||
| `push_back` <br/> `insert` | ❌ | **`capacity()` changed.** If the vector had to reallocate its internal buffer, then the elements will be copied over to a new buffer, invalidating all existing iterators. |
| `push_back` <br/> `insert` | ❌ | **Iterators after modified element.** These iterators will be pushed forwards, so they will no longer refer to the same elements. |
| `push_back` <br/> `insert` | ✅ | **All other cases** |
| `pop_back` <br/> `erase` | ❌ | **Iterators after modified element.** These iterators will be pushed backwards, so they will no longer refer to the same elements. | 
| `pop_back` <br/> `erase`  | ✅ | **All other cases** |
| **`std::deque`** |||
| `push_front` <br /> `push_back` <br /> `insert` | ❌ | All iterators are invalidated |
| `pop_front` <br /> `pop_back` | ❌ | **Iterators to front/back elements** |
| `pop_front` <br /> `pop_back` | ✅ | **All other cases** |
| `erase` | ❌ | **If middle elements were erased,** all iterators are invalidated |
| **`std::map`, `std::set`** |||
| `insert` <br />  `operator[]` | ✅ | |
| `erase` <br />  | ✅ | **Except for iterators to erased element** |
| **`std::unordered_map`, `std::unordered_set`** |||
| `insert` <br />  `operator[]` | ❌ | **Insertion caused rehash[^4]** |
| `insert` <br />  `operator[]` | ✅ | |
| `erase` <br />  | ✅ | **Except for iterators to erased element** |

[^4]: This shows [another benefit](./associative-containers#which-should-i-use) to using `std::map` over `std::unordered_map` if iterators to elements are employed extensively: `std::map` has more stable iterators that are less likely to be invalidated.

## Iterator Flavors

Occasionally, you will discover some variants of the above iterator concepts when working with C++ in practice. These iterator "flavors" allow us to handle `const` containers more appropriately, as well as work with bidirectional iterators in reverse order.

### `const` Iterators

Given a `const` container, we would not want to allow elements of that container to be modified through their iterators. This is the idea of <abbr title="The principle that an object declared as const should not be allowed to be modified directly or indirectly through any part of its interface, ensuring logical and contractual immutability">const correctness</abbr>&mdash;objects that are marked `const` should not be allowed to be modified through any part of their interface.

**`const` iterators** allow for container types to conform to this principle. A container type `C` with elements of type `T` will in practice have two iterator types:

* **`C::iterator`** which points to elements of type `T` (e.g. `std::string::iterator` points to `char`)
* **`C::const_iterator`** which points to elements of type `const T` (e.g. `std::string::const_iterator` points to `const char`)

Namely, this means that you cannot modify the elements that a `const_iterator` points to. As a result, every `const_iterator` is necessarily not an output iterator, since you can't write to the underlying element (however, you can still have non-output containers which have a meaningful distinction between their `iterator` and `const_iterator` types![^5]).

[^5]: As an example of this, consider `std::map::iterator`, which points to a `std::pair<const K, V>` representing a key-value pair in the map. This iterator is not output, since modifying the entire key-value pair might change the key, which would change where that entry is stored inside of the map (see the chapter on [associative containers](./associative-containers#behind-the-scenes) as to why)&mdash;this is precisely why the key is a `const K`. That said, we *can still modify the value* through a `std::map::iterator`. For example, the following code is valid:

      ```cpp
      std::map<std::string, size_t> m { { "Fabio", 10 }, { "Jacob", 4 } };

      auto it = m.begin();    // Iterator to { "Fabio", 10 }
      it->second = 106;       // Changes element to { "Fabio", 106 }
      ```

      Now consider what would happen if `it` was a `const_iterator`:

      ```cpp
      const std::map<std::string, size_t> m { { "Fabio", 10 }, { "Jacob", 4 } };

      auto it = m.begin();    // std::map<std::string, size_t>::const_iterator
      // it->second = 106;    // This line doesn't compile!
      ```

      In this updated example, `it` is a `const_iterator` since `m` is marked `const` (const-correctness). Since `it` is a `const_iterator`, the entire element is `const` and we cannot update the value of `"Fabio"` to `106` as we were able to before.

Practically speaking, **`const_iterator` can be used anywhere an `iterator` for the same container was expected, so long as you do not require modification.** For example, iterator algorithms (discussed in the next chapter) which do not modify their range (e.g. [`std::count_if`](https://en.cppreference.com/w/cpp/algorithm/count) counts the number of elements between two iterators) will work just as well on `const_iterator`s as they do on regular `iterator`s. However, algorithms which do modify their range (e.g. [`std::sort`](https://en.cppreference.com/w/cpp/algorithm/sort) sorts the elements between two iterators in-place) will not compile for `const_iterator`.

Given a `const` container `c`, calling `c.begin()` or `c.end()` will automatically return `const_iterator`s through the provided `const` overloads for these methods. However, if you require a `const` iterator for a non-`const` container, you can request these through the following convenience methods defined on every standard library container:

| Container Method | Description |
|--------|-------------|
| [`std::cbegin(c)`](https://en.cppreference.com/w/cpp/iterator/begin) <br /> `c.cbegin()` | Gets a `const_iterator` to the first element of a container |
| [`std::cend(c)`](https://en.cppreference.com/w/cpp/iterator/end) <br /> `c.cend()` | Gets a `const_iterator` to the **past-the-end** element of a container |

### Reverse Iterators

Bidirectional iterators provide an easy way for us to create a reverse ordering of the elements in a container. This is useful if we wanted to iterate through a container in reverse, or if we want to apply an iterator algorithm in reverse order (e.g. `std::find(c.begin(), c.end(), v)` searches for a value `v` starting from the left&mdash;what if we wanted to search from the right?). This is precisely what **reverse iterators** accomplish.

Every container whose iterators are bidirectional provides a reverse iterator interface for iterating backwards through a sequence. These methods are analogous to their ordinary counterparts:

| Container Method | Description |
|--------|-------------|
| [`std::rbegin(c)`](https://en.cppreference.com/w/cpp/iterator/rbegin) <br /> `c.rbegin()` | Gets an iterator to the first element in the container's *reversed* sequence. Dereferencing this iterator yields the last element in the container's ordinary (unreversed) sequence. |
| [`std::rend(c)`](https://en.cppreference.com/w/cpp/iterator/rend) <br /> `c.rend()` | Gets an iterator to the **past-the-end** element in the container's *reversed* sequence. It is invalid to dereference this iterator&mdash;conceptually, it points to a non-existent element one before the first element in the container's ordinary (unreversed) sequence. |
| [`std::crbegin(c)`](https://en.cppreference.com/w/cpp/iterator/rbegin) <br /> `c.crbegin()` | Returns the `const`-iterator version of `rbegin()` |
| [`std::crend(c)`](https://en.cppreference.com/w/cpp/iterator/cend) <br /> `c.crend()` | Returns the `const`-iterator version of `rend()` |

Reverse iterators can only exist for bidirectional iterators: behind the scenes, a reverse iterator stores a regular iterator and moving forward (`operator++`) on the reverse iterator decrements the stored iterator (`operator--`). Reverse iterators are implemented as a templated wrapper ([`std::reverse_iterator`](https://en.cppreference.com/w/cpp/iterator/reverse_iterator)) around a bidirectional iterator, so containers do not need to implement any additional functionality to achieve this result. In effect, a reverse iterator stores an iterator to the element one ahead its dereferenced value, as explained by the diagram below.

```cpp
std::vector<int> v { 1, 2, 3, 4, 5 };

auto rbegin = v.rbegin();
auto rend = v.rend();
```

```memory
conceptual {
  #label title ""
  #label subtitle "Conceptually, we think of reverse iterators as pointing to elements in a *reversed* sequence, with semantics identical to ordinary iterators."
  #label heap "Elements"

  v = &data[1]
  data => b" 12345"

  rbegin = &data[5]
  rend = &data[0]
  
  #style:link { endSocket: left } v
  #style striped data[0]
  #style:link { path: straight } v
}

actual {
  #label title ""
  #label subtitle "Behind the scenes, reverse iterators actually store an iterator that is *one ahead* (i.e. in the ordinary sequence) of where they conceptually point to."
  #label heap "Elements"

  v = &data[1]
  data => b" 12345 "

  rbegin = &data[6]
  rend = &data[1]
  
  #style:link { endSocket: left } v
  #style striped data[0] data[-1]
  #style:link { path: straight } v
  #style:link { dash: { animation: true } } rbegin rend
}

subtitle {
  #label title ""
  #label subtitle "The motivation behind this implementation detail is that a true \"before-the-start\" iterator (what `rend` represents) would be undefined behaviour in C++&mdash;recall that `--v.begin()` is not valid in C++."
}
```

We can get the actual iterator a reverse iterator stores by calling the member function `base()` on it, e.g.

```cpp
std::vector<int> v { 1, 2, 3, 4, 5 };

auto rb = v.rbegin();
auto re = v.rend();

auto rb_base = rb.base();
auto re_base = re.base();
```

```memory
#label title ""
#label subtitle "Notice that `v.rbegin()` actually stores `v.end()` as its `base` iterator, while `v.rend()` stores `v.begin()`."
#label heap "Elements"

v = &data[1]
data => b" 12345 "

rb = &data[5]
re = &data[0]

rb_base = &data[6]
re_base = &data[1]

#style:link { endSocket: left } v
#style striped data[0] data[-1]
#style:link { path: straight } v
#style:link { opacity: 0.5 } rb_base re_base
```

Reverse iterators generally inherit the category of their underlying iterator (e.g. random access iterators are random access in reverse). The only exception to this is contiguous iterators&mdash;since the elements are ordered in reverse, they are no longer strictly contiguous as the addresses decrease instead of increase as you move forward in the reverse sequence.

## Deep Dive: `std::deque::iterator`

In this section, we will see how an iterator might actually be implemented for a real STL container data structure&mdash;in this case, an `std::deque`.  Compilers are free to implement iterators however they choose, so long as the iterator operators are constant time and respect the [invalidation rules](#iterator-invalidation) above. In this section, our implementation will roughly mirror the `g++` compiler's implementation, whose source code can be found [here](https://github.com/gcc-mirror/gcc/blob/master/libstdc++-v3/include/bits/stl_deque.h), with a few simplifications. `std::deque<T>::iterator` is a random-access iterator, but for brevity, we will only implement the bidirectional iterator operations, namely `operator*`, `operator++`, and `operator--`. The remaining random-access operations are left as an exercise to the reader. 

Recall from the chapter on sequence containers that a deque organizes its elements as an array of fixed-sized blocks of elements:

```cpp
std::deque<int> d { 4, 5, 6, 7, 8, 9 };
```

```memory
diagram {
  #label title ""
  d = "deque<int>" { start: &b0[1], finish: &b1[3], blocks: &blocks, capacity: 2 }
  blocks => "blocks" [ 0: &b0, 1: &b1 ]
  b0 ==> b"_456"
  b1 ==> b"789_"

  #style:link { endSocket: top } d.start
  #style:link { opacity: 0.5, dash: true } d.start d.finish
}

caption {
  #label title ""
  #label subtitle "Contrary to what was presented in the sequence containers chapter, `start` and `finish` are actually *iterators* to the elements, not mere indexes. These are represented here in the diagram above as dashed arrows. The implementation of these iterators is what will be discussed in the following section. Notice that `finish` is a *past-the-end* iterator."
}
```

Accordingly, we can imagine that a `std::deque`, behind the scenes, might look something like this:

```cpp
#define BLOCK_SIZE 4

template <typename T>
class _deque_iterator {
  // TODO: Implementation of a deque iterator
  // We will implement this later in this section!
};

template <typename T>
class std::deque<T> {
public:
  using iterator = _deque_iterator<T>;
  using const_iterator = _deque_iterator<const T>;

  iterator begin() { return start; }
  iterator end() { return finish; }

  const_iterator begin() const { return start; }
  const_iterator end() const { return finish; }

  auto rbegin() { return std::make_reverse_iterator(end()); }
  auto rend() { return std::make_reverse_iterator(begin()); }

  auto rbegin() const { return std::make_reverse_iterator(end()); }
  auto rend() const { return std::make_reverse_iterator(begin()); }

  /* Remaining operations of a deque: constructor, push_front, push_back, etc. */

private:
  iterator start, finish;   // begin and end iterators
  T** blocks;               // array of fixed-size block pointers
  size_t capacity;          // allocated size of blocks array
};
```

`_deque_iterator` is the name of the iterator type for a deque which we will implement. Before we do so, take note of a few details:

* `iterator` and `const_iterator` are type aliases for an underlying `_deque_iterator` to a `T` or `const T`, respectively.
* `BLOCK_SIZE` is the fixed size of the individual blocks. In actual practice, `g++`'s definition of this value is a bit more involved, with the actual size depending on the type `T`.
* `begin()` and `end()` have `const` overloads. This will pose a problem for the const-versions of these methods, since `_deque_iterator<T>` cannot be converted to `_deque_iterator<const T>` by default. As a result, we will need to make sure our `_deque_iterator` provides a constructor for converting between these as a result.
* `rbegin()` and `rend()` (and their `const` overloads) call [`std::make_reverse_iterator`](https://en.cppreference.com/w/cpp/iterator/make_reverse_iterator), which given a bidirectional iterator, produces a new iterator to the reversed range. We use `auto` to let the compiler deduce the return type, which will be `std::reverse_iterator<iterator>` (or `std::reverse_iterator<iterator>` for the `const` versions).

So what goes into implementing `_deque_iterator`? For starters, we must decide what data the iterator needs to track in order to increment and decrement the iterator. This poses an interesting challenge: if an iterator points to the end of one block, `operator++` needs to somehow know to move on to the start of the next block. `operator--` must likewise reposition iterators to the final element of the previous block. To solve this, compilers typically keep track of four pointers: the element the iterator points to, the element's block, and the first and last element in that block. In code, we might have a `_deque_iterator` that looks like this:

```cpp
template <typename T>
class _deque_iterator {
private:
  T** block;
  T*  current;
  T*  first;
  T*  last;

public:
  /** Increments an iterator with prefix notation, e.g. ++it */
  _deque_iterator& operator++();

  /** Decrements an iterator with prefix notation, e.g. --it */
  _deque_iterator& operator--();

  /** Allows dereferencing the iterator, e.g. *it */
  T* operator->() const { return current; }

  /** Allows using the arrow operator for compound T, e.g. it->member */
  T& operator*() const { return *current; }

  /** Increments an iterator with postfix notation, e.g. it++ */
  _deque_iterator operator++(int) {
    _deque_iterator prev = *this;
    ++*this;
    return prev;
  }

  /** Increments an iterator with postfix notation, e.g. it-- */
  _deque_iterator operator--(int) {
    _deque_iterator prev = *this;
    --*this;
    return prev;
  }


  /**
   * Constructs a _deque_iterator from an element pointer and the pointer to its block pointer.
   * Sets the first and last pointers using BLOCK_SIZE accordingly.
   *
   * std::deque will call this constructor internally to create iterators (not shown).
   */
  _deque_iterator(T* current, T** block)
    : block(block), current(current), first(*block), last(*block + BLOCK_SIZE)
    { }

  /**
   * Handles conversion from an iterator to a const_iterator.
   * In this case, V = U and T = const U for some typename U
   *
   * Notice that the other way around would not compile,
   * since a const T* cannot be assigned to a T*.
   */
  template <typename V>
  _deque_iterator(const _deque_iterator<V>& it)
    : block(it.block), current(it.current), first(it.first), last(it.last)
    { }
};
```

```memory
#label title ""
#label subtitle "Below is an example of what the `d.begin()` iterator might look like for the deque shown [at the beginning](#deep-dive-stddequeiterator) of this section. The animated arrow is the actual pointer to the element in the deque that the iterator points to."

d = "deque<int>" { blocks: &blocks, capacity: 2 }
blocks => "blocks" [ 0: &b0, 1: &b1 ]
b0 ==> b"_456"
b1 ==> b"789_"

begin("d.begin()") = "_deque_iterator" {
  block: &blocks.0,
  current: &b0[1], 
  first: &b0[0],
  last: &b0[3]
}

#style:link { endSocket: left } begin.block
#style:link { opacity: 0.5, dash: true } blocks.* d.*
#style:link { dash: { animation: true } } begin.current
```

In the above implementation, our `_deque_iterator` class has the four pointers as described, with a constructor that initializes them and a copy constructor that will handle conversion from an `iterator` to a `const_iterator` (both constructors are constant-time, as required). We have hidden the implementation of the core iterator operators&mdash;the prefix `operator++()` and `operator--()`&mdash;which we will cover shortly. Notice that the postfix forms&mdash;`operator++(int)` and `operator--(int)`&mdash;are implemented in terms of their prefix equivalents.

To implement `operator++`, we will attempt to move the `current` pointer to the next contiguous element within its block. If this increment would cause `current` to exceed its block, we will reposition it to the next block pointer, setting `first` and `last` accordingly. This could be implemented as:

```cpp
_deque_iterator& operator++() {
  ++current;                    // Attempt to move current forward
  if (current == last)          // Check OOB (assume last is past-the-end of the block)
  {
    ++block;                    // Move to next block
    first = *block;             // Get first element of block
    last  = first + BLOCK_SIZE; // Get last element of block
    current = first;            // Reposition current
  }
  return *this;
}
```

Notice that while the individual blocks of a deque are not all contiguous in memory, **the `blocks` array which contains all the pointers-to-blocks is itself contiguous!** This allows us to write `++block` in the above implementation. Also notice that `operator++` is constant-time, as required.

Implementing `operator--` will take a similar approach:

```cpp
_deque_iterator& operator--() {
  --current;                    // Attempt to move current backwards
  if (current < first)          // Check OOB (first is in-bounds)
  {
    --block;                    // Move to previous block
    first = *block;             // Get first element of block
    last  = first + BLOCK_SIZE; // Get last element of block
    current = last - 1;         // Reposition current
  }
  return *this;
}
```

Voila! Putting everything together, we have built a bidirectional deque iterator. To complete it, we would need to add the random-access operators, in particular `operator+=` and `operator-=`. One approach might be to call `operator++` and `operator--` above `n` times, except that this would violate the restriction that iterator operations are constant-time. Instead, the actual random-access operators will precompute how many blocks they need to skip, and skip them in one fell swoop (e.g. `blocks += block_offset`). We will not implement this here, but we encourage you to consider how you might implement it yourself or take a look at the `g++` source for these methods.