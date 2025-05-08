---
title: Const Correctness
description: Const correctness ensures objects only change when you want them to!
---

Consider the interface of the `IntVector` we developed earlier in this section:

```cpp
class IntVector {
public:
  int& at(size_t index);
  size_t size();
  void push_back(const int& value);
private:
  /* Implementation details */
};
```

We decide to write a helper function that prints out an `IntVector`[^1]:

[^1]: Later on in this section, we will discuss ways in which you can *overload* `operator<<` so that you can print an `IntVector` (or any class) to `std::cout`.

```cpp
void printVector(const IntVector& vec) {
  for (size_t i = 0; i < vec.size(); i++) {
    std::cout << vec.at(i) << " ";
  }
  std::cout << std::endl;
}
```

Notice that `vec` is passed as a `const` reference. We mark it `const` to ensure that the vector is not modified: printing something out intuitively shouldn't change its state, but simply print the current state as it is. We pass `vec` by reference to avoid making a copy of the vector, which would be the case if we had passed it by value.

When we try to compile and run the above snippet, the compiler complains that there is an issue with the `at` and `size` methods!

```bash
> g++ main.cpp
<source>: In function 'void printVector(const IntVector&)':
<source>:12:34: error: passing 'const IntVector' as 'this' argument discards qualifiers [-fpermissive]
   12 |   for (size_t i = 0; i < vec.size(); i++) {
      |                          ~~~~~~~~^~
<source>:6:10: note:   in call to 'size_t IntVector::size()'
    6 |   size_t size();
      |          ^~~~
<source>:13:24: error: passing 'const IntVector' as 'this' argument discards qualifiers [-fpermissive]
   13 |     vec.at(i)
      |     ~~~~~~^~~
<source>:5:8: note:   in call to 'int& IntVector::at(size_t)'
    5 |   int& at(size_t index);
      |        ^~
```

What is going on? The issue has to do with the use of the `const` keyword. Because `vec` was marked `const` in the above snippet, the compiler will make special care not to allow any undue modifications to the object. This is essentially the idea of <abbr title="The principle that `const` objects should not be modified in an observable way">**const correctness**</abbr> in C++: a `const` object is not allowed to be modified in an observable way, and the compiler, not knowing whether `size` or `at` modify `IntVector`, prevents us from using them at all.

## `const` methods

The issue lies in the fact that the compiler does not know whether `at` or `size` modify the vector. This may seem unintuitive at first: why wouldn't the compiler simply *know*, given all the information about `IntVector` and its methods, that these methods make no changes to its state? For situations like the one presented here, maybe the compiler could intuit this information, but in more complex ones, determining this would be equivalent to knowing if arbitrary code executed&mdash;a [famously unsolvable](https://en.wikipedia.org/wiki/Halting_problem) problem in computer science. Feasability aside, performing this logic would also slow down the compiler.

This why class methods in C++ must *explicitly declare* whether or not they will modify the instance of the class. You can do this by appending `const` to the end of the method:

```cpp
class IntVector {
public:
  int& at(size_t index) `[const]`;
  size_t size() `[const]`;
  void push_back(const int& value);
private:
  /* Implementation details */
};
```

Doing so has a few implications:

* **A `const` object can only invoke `const` methods.** A `const` object only has access to the <abbr title="The set of all methods and fields which are accessible from `const` instance of a class">**`const` interface**</abbr> of the class.

[Solve the problem scenario above by adding `const` to method]
[Explain what this does]

## `const` overloading

[Sometimes you'll have two methods with the same name, but you need to have two versions]

### Using `const_cast` to avoid redundancy

[Show example where two different const versions causes a lot of redundancy]
[Use const_cast to eliminate redundancy]
[Explain that `const_cast` is dangerous in most situations]

## Logical or Physical State?

[Explain how there is a difference between the logical and the physical state of an object]
[It is commonly assumed that `const` protects modifications to the physical state, it is more apt to say it protects the logical state]

### `mutable` keyword

[`mutable` allows more fine-grained changes to a const object than `const_cast`]


