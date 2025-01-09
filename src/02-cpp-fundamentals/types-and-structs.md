---
title: Types and Structs
description: Introduces the C++ type system, and how to construct your own types using structs.
---

## The Type System

The **type** of a variable in C++ is the "category" of that variable, or in other words the kind of object that variable represents. C++ comes with many built-in types, such as `int`, `double`, `bool`, `std::string`, to name a few. C++ enforces the appropriate use of variable types through its **type system**. In particular, C++ is a *statically typed language*, meaning that:

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

Compare this code to its equivalent in Python, a *dynamically typed language*:

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

This is a standard, C-style way of initializing structs. A more modern way might be to used **list initialization**, which is covered in the next section:

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



