---
title: Types and Structs
description: Introduces the C++ type system, and how to construct your own types using structs.
---

## The Type System

The **type** of a variable in C++ is the "category" of that variable, or in other words the kind of object that variable represents. C++ comes with many built-in types, such as `int`, `double`, `bool`, `std::string`, <abbr title="A non-negative integer representing a size or length">`size_t`</abbr>, to name a few. C++ enforces the appropriate use of variable types through its **type system**. In particular, C++ is a <abbr title="A statically typed language enforces type checking at compile time.">statically typed language</abbr>, meaning that:

* every variable must declare a type in the source code
* that type can't change after it's been declared.

To see what that means, take a look at this snippet of C++ code:

```cpp
int a = 3;
std::string b = "test";

void foo(std::string c) {
    int d = 106;
    `[d = "hello world";]`
}
```

Notice that each variable (`a`, `b`, `d`), parameter (`c`), and function return type (`foo`) is required to specify a type, and that attempting to change the existing type of a variable (for example, assigning `d` from an `int` to a `std::string`) as shown in the highlighted region, causes a compiler error.

> `void` is a special type indicating that a function has no return type. 

Compare this code to its equivalent in Python, a <abbr title="A dynamically typed language enforces type checking at runtime.">dynamically typed language</abbr>:

```python
a = 3
b = "test"

def foo(c):
    d = 106
    d = "hello world"
```

Notice that types are omitted, and one can change the type of the variable dynamically from an `int` to a `str` without issue.

> Unlike Python, C++ allows two functions to have the same name, as long as they differ in number or type of parameters. This is known as **function overloading**. For example, if we declare the functions
> 
> ```cpp
> double func(int x) {
>     return x + 3.0;
> }
> 
> double func(double x) {
>     return x * 3;
> }
> ```
>
> Then calling `func(2)` will return `5.0`, whereas `func(2.0)` will return `6.0` (notice the parameter was an `int` in the first case, and a `double` in the second).

### Why static typing?

Static typing offers a number of benefits to performance and readability. In particular, it gives the compiler additional information about variables, allowing it to allocate memory for these variables more efficiently. The compiler might also be able to make additional performance optimizations in the resulting machine code if it can depend on the values having a certain structure in memory, and eliminate the need for runtime checks on the type of an object that a dynamically typed language may suffer.

In larger organizations and codebases, static typing also makes code easier to understand and reason about. Knowing that an object is an `int` or a `std::string` tells you what operations are valid for that object (e.g. it makes sense to multiply two `int`s, but not two `std::string`s) and where it can be used (which functions it can be passed to). In the case of C++, these restrictions are enforced by the compiler when code is compiled. 

For example, the following Python program runs but encounters a runtime error:

```python
def add_3(x):
    return x + 3

add_3("oops") # Oops, that's a string. Runtime error!
```

However, it fails to compile in C++:

```cpp
int add_3(int x) {
    return x + 3;
}

add_3("oops"); // Can't pass a string where an int was expected. Compiler error!
```

This is a simple example, but in a larger system with many interlocking parts, having a robust type-system makes it possible to catch these kinds of errors before the program has a chance to run.

## Structs

Structs are a way to extend the type system by bundling multiple values together into one object. 

### A motivating example

Imagine that you are working for a university IT department that manufactures ID cards for enrolled students. The university wants to automate the process for printing new student ID cards using a C++ interface, and asks you to write the following function:

```cpp
????? printIDCard();
```

However, an ID card has more than one piece of information that you want to keep track of. For example, we want to track the name, ID number, and email of the associated student. How can we return all three pieces of information from one function (what do we replace the `?????` with in the code above)?

### Declaring and instantiating structs

One way to accomplish this is to declare a struct that represents the combination of all three values:

```cpp
struct IDCard {
    std::string name;
    int number;
    std::string email;
};
```

Notice that the struct above is composed of three **fields**, each looking somewhat like a variable, with a name and a type. We could then implement the `printIDCard` function to initialize and return an `IDCard` like so:

```cpp
IDCard printIDCard() {
    IDCard id;
    id.name = "Miguel de Cervantes";
    id.number = 1605;
    id.email = "miguel@quijote.edu";
    return id;
}
```

> This function always returns the same ID—a more realistic implementation would probably return different IDs, depending on a variety of factors (already in-use ID, name of the student whose ID should be generated, etc.)

This is a standard, C-style way of initializing structs. A more modern way might be to use <abbr title="A consistent syntax to initialize objects of different types using curly braces {}">uniform initialization</abbr>, which is covered in the next chapter:

```cpp
IDCard printIDCard() {
    IDCard id { "Miguel de Cervantes", 1605, "miguel@quijote.edu" };
    return id;
}
```

Notice that the order that the fields are initialized in this format depends on the order that they were declared in the `IDCard` definition. We can simplify this even further like so:

```cpp
IDCard printIDCard() {
    return { "Miguel de Cervantes", 1605, "miguel@quijote.edu" };
}
```

### `std::pair`

Often times, we want to refer to a pair of values without creating an entirely new struct. For example, suppose we implement a function that finds the first and last indices of a character in a string:

```cpp
struct CharacterIndices {
  size_t first;
  size_t last;
};

CharacterIndices find(std::string str, char c) {
  size_t first, last = std::string::npos;
  /* Code to find the first and last indices */
  return { first, last };
}
```

> `std::string::npos` is a special value that refers to a non-existent position in a string. Read more in the [C++ documentation](https://en.cppreference.com/w/cpp/string/basic_string/npos).

This code would work great! But suppose that this is the only time we ever used the `CharacterIndices`. Rather than spin-up a new type, it would be more direct to use `std::pair` instead:

```cpp
`[std::pair<size_t, size_t>]` find(std::string str, char c) {
  size_t first, last = std::string::npos;
  /* Code to find the first and last indices */
  return { first, last };
}
```

This code functions equivalently, but returns the built-in type `std::pair` instead. The fields of `std::pair` are `first` and `second`:

```cpp
std::string marquez = "Colonel Aureliano Buendía was to remember that distant afternoon";

std::pair<size_t, size_t> result = find(marquez, "a");
std::cout << result.first << std::endl;
std::cout << result.second << std::endl;
```

> `std::pair` is technically not a type, but a <abbr title="A blueprint that allows functions or classes to operate with generic types, enabling code reuse and type flexibility.">**template**</abbr>. When using pair, we must list the types of `first` and `second` inside the `<>` characters, e.g. `std::pair<std::string, size_t>`. Templates will be discussed extensively in a later chapter.

## Modern Typing

Because C++ is a statically-typed language, the types of every variable, parameter, and function return type must be known at compile time. While this affords us many perks (as discussed above), writing out long type names can become inconvenient. To counteract this, modern C++ offers two mechanisms to make typing easier.

Consider the following function signature, which computes the solution to the quadratic equation $ax^2+bx+c=0$ as a `std::pair<bool, std::pair<double, double>>`. Note that the `bool` field indicates whether or not the equation had a solution. 

```cpp
std::pair<bool, std::pair<double, double>> solveQuadratic(double a, double b, double c);
```

> In modern C++, it would make more sense to return a `std::optional<std::pair<double, double>>` here. `std::optional` is discussed in a later chapter.

### Type aliases with `using`

To avoid the hassle of writing a long type name like `std::pair<bool, std::pair<double, double>>`, we could create a type alias for that type with the `using` keyword. If you have used C before, this is identical to a `typedef`:

```cpp
using QuadraticSolution = std::pair<bool, std::pair<double, double>>;

`[QuadraticSolution]` solveQuadratic(double a, double b, double c);

int main() {
  `[QuadraticSolution]` soln = solveQuadratic(1, 2, 3);
  return 0;
}
```

`QuadraticSolution` has the benefit of being a shorter type name, but also might be a bit clearer. Rather than being a seemingly-arbitrary pair object, we know that this specifically refers to a solution to a quadratic equation. In all other aspects, however, the code would be identical if we had written the type out by hand.

### Type deduction with `auto`

In other cases, we'd prefer not to have to worry about the types at all. In these situations, we can write the type as `auto` to have the compiler infer a variable, parameter, or function return type from the context in which it occurs. For example:

```cpp
int main() {
---
  `[auto]` soln = solveQuadratic(1, 2, 3);
---
  return 0;
}
```

To be clear, this code is still statically typed! It would be invalid to try to assign anything other than a `std::pair<bool, std::pair<double, double>>` to `soln`, and this code is exactly the same as if we had written `std::optional<std::pair<double, double>>` in place of `auto`. However, we let the compiler do the heavy lifting for us: since it knows what the return type of `solveQuadratic` is, it **infers** (or deduces) the type of `soln`.

One area you will often see this used is in <abbr title="A concise way to iterate over all elements in a container or range. E.g. `for (auto elem : v) { }`">range-based for loops</abbr>. For example:

```cpp
std::vector<int> vec { 1, 2, 3, 4 };
for (`[auto]` elem : vec) {
  std::cout << elem << " ";
}
```

Because we are iterating through a `std::vector<int>`, the compiler is smart enough to infer that the type of `elem` is `int`.

The compiler can even infer the return type of a function, so long as it is unambigiously clear what that return type is:

```cpp
`[auto]` smeagol() {
  return 20;
}
```

In this case, the compiler examines the type of the returned object (`20`) to derive the return type of `smeagol` as `int`. However, in the following example, the compiler cannot deduce if the return type is, e.g. a `std::pair<double, double>`, a `std::vector<double>`, or some user-defined struct containing two `double` fields:

```cpp
`[auto]` oops() {
  return { 106.0, 107.0 };
}
```

To fix this issue, we can explicitly specify the return type:

```cpp
std::pair<double, double> yay() {
  return { 106.0, 107.0 };
}
```

> In C++, you can even list the type of a parameter as `auto`. As we will learn in the **Templates** chapter, this syntax is exactly identical to creating a function that is templated on the `auto` argument, meaning that the `auto` type will be inferred with whatever type is passed to the function when it is called.
>
> ```cpp
> void borges(`[auto]` cuento) {
>   std::cout << cuento << std::endl;
> }
>
> borges(std::string { "el sur" }); // `[auto]` deduced as `std::string`
> ```
>