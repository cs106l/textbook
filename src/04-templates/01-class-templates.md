---
title: Class Templates
description: Template classes generalize classes across data types
---

Imagine you are working for a software startup and you are asked to come up with a C++ data structure that handles a list of integer values. Thinking it over, you come up with the following data structure:

```cpp
class int_vector {
public:
  void push_back(int i);
  size_t size() const;
  int& operator[](size_t index) const;

  /* Other methods and implementation hidden */
};
```

Your company quickly realizes that you'd like to keep track of other data types as well, for example `double` and `std::string`. One approach is to just write more data types:

```cpp
class double_vector { /* ... */ };
class string_vector { /* ... */ };
```

This approach suffers from two problems. On the one hand, there is a lot of redundant work! A `double_vector` is going to contain very similar logic as an `int_vector` and a `string_vector` (the only salient difference will be the change of data type). This makes it not only tedious to write, but also difficult to maintain if the interface ever needs to change. On the other hand, it cannot possibly capture all of the variation in types: what if we want to have a list of a custom data type, or a list of lists of integers? We can certainly hand-write our own data structure as such cases arrise, but if our code is intended to be used as a library, this inflexibility is unacceptable.

**Templates** offer a solution to this problem. We'll declare a template for our class using one or more <abbr title="A variable inside of a template which will be filled in with a specific type/value at compile time when the template is instantiated">*template parameters*</abbr> which get replaced with a specific type when we use the template.

## Template Basics

We can merge our `int_vector`, `double_vector`, `string_vector` into a single `vector` class template like so:

```cpp
template <typename T>
class vector {
public:
  void push_back(const T& i);
  size_t size() const;
  T& operator[](size_t index) const;

  /* Other methods and implementation hidden */
};
```

As you can see, the template looks almost identical to a regular class, except we prefix it with `template <typename T>`. This syntax introduces a single template parameter, `T`, which stands in place of a type name. Then, when we write

```cpp
vector<int> v;
```

the compiler will <abbr title="Transform (at compile time) a template into a usable class definition by filling in its template parameters">*instantiate*</abbr> the template by textually replacing every instance of `T` with `int` to produce a class declaration. Instantiation happens only once for a given configuration of template parameters&mdash;if we used a `vector<int>` again within the same file, the instantiated template would be reused. If we wrote

```cpp
vector<int> v1;
vector<double> v2;
vector<std::string> v3;
```

the compiler would generate three different templates. The end result is the same as if we had written out an `int_vector`, `double_vector`, and `string_vector` by hand. The ability of the compiler to generate these classes automatically, however, overcomes the aforementioned limitations of writing out the classes by hand. Not only is the redundancy eliminated, but if the template ever changes, the compiler will pick up the latest changes at compile time. Templates are a form of code generation: as we will see, a common theme of templates will be to take a task that could theoretically be written out by hand in a redundant way and finding clever ways to let the compiler write the code for us.

One consequence of instantiation is that a `vector<int>` and a `vector<double>` are fundamentally different classes. Although they were instantiated from the same template, they are as different as an `int_vector` would be from a `double_vector` if we had written these classes out by hand. A function which expects a `vector<int>` cannot accept a `vector<double>`. To write a function that could accept any `vector<T>`, we would need to make the function itself a template. This is discussed in the next chapter.

Another consequence of instantiation is that we can expect a program that uses templates to be larger and slower to compile. It will be larger because more (redundant) code gets compiled into the final executable, in the same way that a program declaring and using an `int_vector`, `double_vector`, and `string_vector` will be larger than one which only had an `int_vector`. It will take longer to compile because the compiler must do an extra pass to instantiate templates. As we will see in future chapters, this process is not always as trivial as a simple find-and-replace[^1]. In fact, it's not uncommon for a programs which make extensive use of templates to see noticeable increases in compilation time.

[^1]: For example, imagine a template which when instantiated, produces another template instantiation. This kind of recursive template instantiation is what distinguishes templates from simple macros and is a hallmark of the technique called *template metaprogramming*.

## Template Quirks

By this point, you should have a rudimentary understanding of templates. As you read about and use templates, there are a few quirks and peculiarities to keep in mind&mdash;this section discusses a few.

### `typename` vs. `class`

### Declaration vs. Definition

### Default Parameters

### Non-Type Parameters