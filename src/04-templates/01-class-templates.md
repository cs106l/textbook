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

Your company quickly realizes that you'd like to keep track of other data types as well, for example `double` and `std::string`. One approach is to just create more data types:

```cpp
class double_vector { /* ... */ };
class string_vector { /* ... */ };
```

This approach suffers from two problems. On the one hand, there is a lot of redundant work! A `double_vector` is going to contain very similar logic as an `int_vector` and a `string_vector` (the only salient difference will be the change of data type). This makes it not only tedious to write, but also difficult to maintain if the interface ever needs to change. On the other hand, it cannot possibly capture all of the variation in types: what if we want to have a list of a custom data type, or a list of lists of integers? We can certainly hand-write our own data structure as such cases arrise, but if our code is intended to be used as a library, this inflexibility is unacceptable.

**Templates** offer a solution to this problem. We'll declare a template for our class using one or more <abbr title="A variable inside of a template which will be filled in with a specific type/value at compile time when the template is instantiated">*template parameters*</abbr> which get replaced with a specific type when we use the template.

## Declaring a template

We can merge our `int_vector`, `double_vector`, `string_vector` into a single `vector` class template like so:

```cpp
template <typename T>
class vector {
public:
  void push_back(const T& v);
  size_t size() const;
  T& operator[](size_t index) const;

  /* Other methods and implementation hidden */
};
```

As you can see, the template looks almost identical to a regular class, except we prefix it with `template <typename T>`. This syntax introduces a single template parameter, `T`, which stands in place of a type name. Then, when we write

```cpp
vector<int> v;
```

the compiler will <abbr title="Transform (at compile time) a template into a usable declaration by filling in its template parameters">*instantiate*</abbr> the template by textually replacing every instance of `T` with `int` to produce a class declaration. Instantiation happens only once for a given configuration of template parameters&mdash;if we used a `vector<int>` again within the same file, the instantiated template would be reused. If we wrote

```cpp
vector<int> v1;
vector<double> v2;
vector<std::string> v3;
```

the compiler would generate three different templates. The end result is the same as if we had written out an `int_vector`, `double_vector`, and `string_vector` by hand. The ability of the compiler to generate these classes automatically, however, overcomes the aforementioned limitations of writing out the classes by hand. Not only is the redundancy eliminated, but if the template ever changes, the compiler will pick up the latest changes at compile time. Templates are a form of code generation: as we will see, a common theme of templates will be to take a task that could theoretically be written out by hand in a redundant way and finding clever ways to let the compiler write the code for us.

**Note that a template class is not a class.** A template only becomes a class after filling in all of its templates parameters. Notationally, `vector` is a template for a class whereas `vector<int>` is an actual class. One consequence of instantiation is that a `vector<int>` and a `vector<double>` are fundamentally different types. Although they were instantiated from the same template, they are as different as an `int_vector` would be from a `double_vector` if we had written these classes out by hand. A function which expects a `vector<int>` cannot accept a `vector<double>`. To write a function that could accept any `vector<T>`, we would need to make the function itself a template. This is discussed in the next chapter.

Another consequence of instantiation is that we can expect a program that uses templates to be larger and slower to compile. It will be larger because more (redundant) code gets compiled into the final executable, in the same way that a program declaring and using an `int_vector`, `double_vector`, and `string_vector` will be larger than one which only had an `int_vector`. It will take longer to compile because the compiler must do an extra pass to instantiate templates. As we will see in future chapters, this process is not always as trivial as a simple find-and-replace[^1]. In fact, it's not uncommon for a programs which make extensive use of templates to see noticeable increases in compilation time.

[^1]: For example, imagine a template which when instantiated, produces another template instantiation. This kind of recursive template instantiation is what distinguishes templates from simple macros and is a hallmark of the technique called *template metaprogramming*.

## Implementing a template

The `vector` template above declares three methods: `push_back`, `size`, and `operator[]`. Where do we place the definitions for these methods?

If you have read the previous section on classes, your first instinct might be to create a `vector.cpp` file like this:

```cpp
// vector.cpp

template <typename T>
void vector<T>::push_back(const T& v) { /* ... */ }

template <typename T>
size_t vector<T>::size() const { /* ... */ }

template <typename T>
T& vector<T>::operator[](size_t index) const { /* ... */ }
```

<sup>Notice that we must repeat the `template <typename T>` and `vector<T>` syntax in the definitions of the class template's member functions![^3]</sup>

[^3]: Remember, `vector` is a template whereas `vector<T>` is an actual type name. This is why it would be invalid to write:

    ```cpp
    template <typename T>
    void [`vector`]::push_back(const T& v) { /* ... */ }
    ```

    as `vector` does not name a type.

As discussed previously, placing the definitions into a `.cpp` file like this improves compilation times. When the compiler is compiling another file that wants to use `vector`, they need only include `vector.h`&mdash;they don't also need to compile `vector.cpp`. This is known as <abbr title="The process of compiling source files independently from one another, enabling faster compilation">separate compilation</abbr>. Unfortunately for us, **templates cannot be separately compiled: we cannot easily split their code between a `.h` and `.cpp` file.**

To see why, suppose that a compiler tried to compile `vector.cpp` above using separate compilation. The compiler must decide for which types `T` it will generate code for. Presumably, if another file calls `push_back` on a `vector<int>`, we'd want to generate a definition for `vector<int>::push_back`, or if another file gets the size of a `vector<std::string>`, we'd need a `vector<std::string>::size` definition. However, looking at `vector.cpp` alone, the compiler cannot deduce which `T` are used: to do so, it would need to scan over the rest of the source files, compile them, and then examine every instantation of `vector<T>`. This problem poses a challenge to compiler designers and defeats the purpose of separate compilation.

To get around this, the compiler must see the entire template when it is included. In other words, including `vector.h` should also include its definitions so that the including file (which knows which `T` are used) can compile them. For this reason, class templates are usually distributed as header-only libraries: they implement the template entirely within one file. Taking the `vector<T>` template above as an example, here are three ways we might implement a template:

1. **Write the definitions inline in the `.h` file.**

    ```cpp
    // vector.h

    template <typename T>
    class vector {
    public:
      void push_back(const T& v) `[{ /* ... */ }]`
      size_t size() const `[{ /* ... */ }]`
      T& operator[](size_t index) const `[{ /* ... */ }]`

      /* Other methods and implementation hidden */
    };
    ```

2. **Write the definitions below the declaration.**

    ```cpp
    // vector.h
    
    template <typename T>
    class vector {
    public:
      void push_back(const T& v);
      size_t size() const;
      T& operator[](size_t index) const;

      /* Other methods and implementation hidden */
    };

    `[template <typename T>
    void vector<T>::push_back(const T& v) { /* ... */ }

    template <typename T>
    size_t vector<T>::size() const { /* ... */ }

    template <typename T>
    T& vector<T>::operator[](size_t index) const { /* ... */ }]`
    ```

3. **Include a `.cpp` file from the `.h` file.** This is the opposite of what you would normally do! 

    ```cpp
    // vector.h
    
    template <typename T>
    class vector {
    public:
      void push_back(const T& v);
      size_t size() const;
      T& operator[](size_t index) const;

      /* Other methods and implementation hidden */
    };

    `[#include "vector.cpp"]`
    ```

    ```cpp
    // vector.cpp

    `[template <typename T>
    void vector<T>::push_back(const T& v) { /* ... */ }

    template <typename T>
    size_t vector<T>::size() const { /* ... */ }

    template <typename T>
    T& vector<T>::operator[](size_t index) const { /* ... */ }]`
    ```

One problem with these approaches is that they may end up inadvertently increasing compilation times, since every file that includes `vector.h` will end up separately compiling the same definitions. This is usually not a concern in practice, and most template libraries, for example the G++ compiler's implementation of the standard template library headers like `<vector>` and `<map>`, use header-only libraries[^2].

[^2]: For example, the G++ source code for `<vector>` can be found inside a header-only library called [`<bits/stl_vector.h>`](https://github.com/gcc-mirror/gcc/blob/master/libstdc++-v3/include/bits/stl_vector.h) containing the actual `vector` template declaration.

There is a fourth, less-commonly used way to get around this problem and still enjoy the benefits of separate compilation. We could separate the `.h` and `.cpp` file as we would normally do for a class, and **explicitly instantiate the template in advance in the `.cpp` file.** For instance:

```cpp
// vector.cpp

#include "vector.h"

/* Definitions of the vector methods */

// Explicit instantiation:

template class vector<int>;
template class vector<double>;
template class vector<std::string>;
```

The `template class` syntax *explicitly instantiates* the template, such that another file including `vector.h` would be able to create a `vector` of `int`, `double` or `std::string` and use its methods. Trying to do the same for a `vector<float>`, for example, or any other type not instantiated, would result in a compiler error. This has the benefit of improving compilation times and reducing the size of the compiled program at the cost of some inflexibility&mdash;we have to specify the template instantiations in the `.cpp` file in advance to compile the relevant definitions.

## Template Quirks

By this point, you should have a rudimentary understanding of templates. As you read about and use templates, there are a few quirks and peculiarities to keep in mind&mdash;this section discusses a few.

### `typename` vs. `class`

### Default Parameters

### Non-Type Parameters