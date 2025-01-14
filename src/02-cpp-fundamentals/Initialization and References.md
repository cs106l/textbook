---
title: Initialization and References
description: Introduces the concept of variable construction and some memory semantics that C++ provides.
---

## How to initialize objects?

To initialize a variable is to provide a value at the time it's created. There are three foundational methods of initialization we're going to discuss: direct initialization (C++98), uniform initialization (C++11), and structured binding (C++17).

## Direct initialization (C++98)

This is the likely what you're familiar with if you're coming from a programming language like Python. Namely it looks something like this:

```cpp,runnable
int main() {
    `[int foo = 12.0;]`
    return 0;
}
```

The above is equivalent to:

```cpp,runnable
int main() {
    `[int foo(12.0);]`
    return 0;
}
```

Syntactically speaking, direct initialization relies on the use of a `=` or a parenthesis `()`.


| Advantages | Disadvantages |
|------------|---------------|
| In cases where you're initializing something like an integer, or a built-in type, like `int`, `double`, `bool`, `std::string`, to name a few, of C++, direct initialization is conventient and simple. | if you notice the above examples we've declared that foo is an _`int`_. However, we're initializing it using the value 12.0, which is a `double`. Yet, the compiler here won't actually produce an error if you use default initlizatiing. Given that C++ is a statically-typed language, in the scenario where this type mis-match between the variable and the value isn't a deliberate choice, as it is here, this would be considered a bug. This is known as a **narrowing conversion**, where the compiler will implicitly cast the value assigned to a variable to the type of the variable. | 

## Uniform Initialization (C++11)

Uniform initialization resolves many of the problems that come with direct initialization -- namely the type safety issue associated with narrowing conversion. More importantly, uniform initialization works for **_ALL_** types in C++, even those that you'll define, like structs and custom classes.

Let's use the `IDCard` example from the last section, recall it looks like this:

```cpp
struct IDCard {
    std::string name;
    int number;
    std::string email;
};
```

If we want to make an email for Miguel de Cervantes we can use list initialization to do it as follows:

```cpp
int main() {
    IDCard id `[{ "Miguel de Cervantes", 1605, "miguel@quijote.edu" }]`;
    return 0;
}
```

In order to use uniform initialization we need to wrap the values that we want to construct our variable with within `{}` brackets. Special attention needs to be paid to the values that are passed into the brace-encolsed initialzer. Uniform initialization enforces type-safety in C++ in that if the types of the values passed in which will be used in variable construction defer from those that we expect, the compiler will throw an error.

For instance the following:

```cpp
int main() {
    IDCard id { "Miguel de Cervantes", 1605.5, "miguel@quijote.edu" };
    return 0;
}
```

would throw an error like this:

```sh
error: type 'double' cannot be narrowed to 'int' in initializer list [-Wc++11-narrowing]
        IDCard id { "Miguel de Cervantes", 1605.5, "miguel@quijote.edu" };
                                                ^~~~~~
```

Because we've said that within a `IDCard` struct the number value should be of type `int`. Uniform initialization of objects enforces this. Naturally this also prevents you from doing something like this:

```cpp
int main() {
    IDCard id { 1605, "miguel@quijote.edu", "Miguel de Cervantes" };
    return 0;
}
```

because (1) it would be magic for the compiler to "know" how it should unpack each of the value(s) that you provide to it, which forces you to provide the value(s) in the order in which they're declared within the struct (in this case `name`, `number`, and `email`) and (2) this ordering enforces that each value in the brace-enclosed initializer corresponds to the type of the member declared at the same position within the struct.

### Example usage with C++ data structures

#### Vector

```cpp
#include <vector>
int main() {
    std::vector<int> v{1, 2, 3, 4, 5};
    return 0;
}
```

#### Map

```cpp
#include <iostream>
#include <map>
int main() {
    std::map<std::string, int> ages{
        {"Alice", 25},
        {"Bob", 30},
        {"Charlie", 35}
    };

    // Accessing map elements
    std::cout << "Alice's age: " << ages["Alice"] << std::endl;
    std::cout << "Bob's age: " << ages.at("Bob") << std::endl;
    return 0;
}
```

### Advantages

- Ubiquitous
- Type-safe

### Disadvantages

- Overloading conflicts with uniform initialization

## Structured Binding (C++17)

Structured binding is a method of initializing variables from data structures with size known at compile-time. For example:

```cpp,runnable
std::tuple<std::string, std::string, std::string> getClassInfo() {
    std::string className = "CS106L";
    std::string location = "online";
    std::string language = "C++";
    return {className, location, language};
}
int main() {
    `[auto [className, location, language] = getClassInfo();]`
    std::cout << "Join us " << location << " for " << className << " to learn " << language << "!" << std::endl;
    return 0;
}
```

In the above example, we're introducing the `std::tuple<Class ...>` data structure. At compile time, the size of the tuple is known so we can unpack the values in the tuple into variables, as we can see in the highlighted code above.

The syntax for structured binding is:

```cpp,runnable
auto [var1, var2, ..., varN] = expression;
```

Where the expression just evaluates to a data structure whose size is known at compile-time. Note, we have to use the `auto` type identifier here because `var1`, `var2`, etc. are not guaranteed to be of the same type, so the compiler does the heavy lifting for us here and deduces the types of each unpacked variable.

It's important to note that this initialization technique only works with data structures whose size is known at compile-time. For instance, the following code would not work.

```cpp,runnable
std::vector<std::string> getClassInfo() {
    std::string className = "CS106L";
    std::string location = "online";
    std::string language = "C++";
    std::vector<std::string> classVector {"CS106L", "online", "C++"};
    return classVector;
}
int main() {
    auto [className, location, language] = getClassInfo();
    std::cout << "Join us " << location << " for " << className << " to learn " << language << "!" << std::endl;
    return 0;
}
```

The `std::vector` data structure doesn't have a known size at compile-time.

## What is a reference?

C++ has rich memory semantics embedded into it, and at its core sits the idea of a reference. Precisely, a reference is an alias to something that already exists in memory. A reference in C++ is denoted using and ampersand(`&`) character.

Here's a simple example:

```cpp,runnable
int main() {
    int x = 10;
    int`[&]` reference = x;
    return 0;
}
```

In the above example a variable, `x`, is declared and a reference to that variable is made. So what this means is that the variable `reference` points to the same underlying memory as `x`, so any chance made to `reference` will also be reflected on `x`.

```cpp,runnable
int main() {
    int x = 10;
    int copy = x;
    return 0;
}
```

In the above example, where we omit the `&`, there is no longer a reference to `x`. So any changes made the the variable `copy` won't be reflected on `x`.

### Pass-by-Value

In practice, references are commonly used in function signatures. By default, when you pass an argument into a function, if you omit marking it as a reference, it makes a copy of the argument. Let's look at an example.

```cpp,runnable
void squareN(int N) {
    N*=N;
}

int main() {
    int num = 5;
    squareN(num);
    // num is still 5 here!
    return 0;
}
```

All arguments to `squareN` are copies, therefore the `N` in the calling function will be unaffected. This is called Pass-by-Reference.

### Pass-by-Reference

If we want to pass a variable from a calling function into another function and have it be modified then we need to pass it by reference. Using the above example for completeness:

```cpp,runnable
void squareN(`[int& N]`) {
    N*=N;
}

int main() {
    int num = 5;
    squareN(num);
    // num 25 here!
    return 0;
}
```

Now, since we're explicitly making `N` a reference using `&`, then `num` from the caller `main()` will be modified.
