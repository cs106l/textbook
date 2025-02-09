---
title: Pointers and Memory
description: Pointers refer to the location of an object in memory
---

## An Introduction to Memory

Every computer program must manipulate memory. In any programming language, every object that you create lives somewhere in the program's memory. In the case of C++, this is equally true: every `int`, `float`, `std::string`, and `std::vector`, among others, must store its contents somewhere in memory. When it is launched, the operating system gives each program (more specifically, each <abbr title="An instance of a running program that includes its code, data, and system resources managed by the operating system">process</abbr>) some amount of memory that it is allowed to work with, known as it's address space. In many common programming languages, such as Python, the use of this address space is managed for you automatically. The same is true for the most part in C++, however C++, being a systems programming language, also gives you direct access of this memory through a feature of the language known as **pointers**.

Conceptually, the address space can be thought of as one big blob of binary data: ones and zeros. However, in practice, this blob is divided into separate sections, each having its own purpose. Traditionally, these are:

| Region | Description |
|--------|-------------|
| Shared Memory | Memory reserved by the operating system that is shared with the program to allow, for example, communication between the current process and the operating system and/or other processes |
| Stack | Stores function calls, local variables, and control flow information, growing and shrinking automatically as functions execute (described below) |
| Heap | Stores dynamically allocated objects, where objects persist beyond function calls and require explicit management by the programmer (described below) |
| Global Variables | Variables declared outside of a function live here |
| Instructions | Also called the *text* segment. This is the process's code being currently executed: raw machine code emitted by the compiler lives here |

Each region has an important purpose, but for our discussion regarding C++, we will focus on the **stack** and the **heap**.

### The Stack

### The Heap