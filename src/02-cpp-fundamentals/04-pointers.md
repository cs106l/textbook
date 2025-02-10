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

Each region has an important purpose, but for our discussion regarding C++, we will focus on the **stack** and the **heap**, as these are where a program's variables are stored.

### The Stack

The **stack** (also known as the **call stack** or **program stack**) is where function calls and their local variables are stored. Every time you invoke a function, a <abbr title="A section of the stack that holds a function's local variables and bookkeeping information during its execution">**stack frame**</abbr> (also known as an *activation record*) is created to store that function's local variables. 

The stack works kind of like a stack of plates: when you want to add more plates, you add them to the top of the stack, and when you need a plate, you remove one off the top. However, you wouldn't remove a plate from the bottom or middle&mdash;at least not easily! Similarly, every time you call a function, a stack frame is *pushed* to the top of the stack, and when function invocation finishes, a stack frame is *popped* from the top of the stack.

Since `main` is the first function called by any C++ program, there will always be a `main` function that remains at the bottom of the stack for the duration of the program (and is only popped when the program exits). As other functions are invoked, their stack frames are pushed on top of the previous one.

We can diagram this process for any point in a program's lifetime using a *stack diagram*. Note that because the stack actually grows downward in memory (more on this later), it is often diagrammed with `main` at the top and other functions below it. For example, consider the following (simple) program:

```cpp
int main() {
  `[]`
  foo(106);
  int x = 107; `[]`
  return 0;
}

void foo(int z) {
  int y = z; `[]`
}
```

```memory
L1 {
  #label subtitle "At this point, a single empty stack frame exists for `main`. Notice that it does not contain an entry for variable `x` since it has not been declared yet at this point in the program."
  main:
}

L3 {
  #label subtitle "`main` calls `foo`, pushing a new stack frame onto the stack. `foo` declares `y`, as shown by the entry for `y` within its frame."
  main:
  foo:
  y = 106
}

L2 {
  #label subtitle "`foo` finishes executing, so its frame is popped from the stack. `main` declares `x`."
  main:
  x = 107
}
```

The stack is not in an inexhaustible resource[^1], and care must be taken to avoid nesting so many function calls that it runs out of space. For example, consider this buggy program intended to compute the factorial of a number:

[^1]: TODO: resources regarding actual sizes of stack on various platforms

```cpp
int main() {
  std::cout << factorial(4) << "\n";
  return 0;
}

---
int factorial(int n) {
  return n * factorial(n - 1);
}
---
```

When invoked with `factorial(4)`, it would produce stack frames like this:

```memory
main:
f4("factorial"):
n = 4
f3("factorial"):
n = 3
f2("factorial"):
n = 2
f1("factorial"):
n = 1
f0("factorial"):
n = 0
fm1("factorial"):
n = -1
fm2("factorial"):
n = -2
dots("⋮"):
```

Lacking a <abbr title="A stopping condition in a recursive function that prevents infinite recursion">base case</abbr>, `factorial` will continue to push stack frames indefinitely. Because the operating system only allocates so much memory to the stack, eventually the program will run out of space, triggering a <abbr title="A runtime error that occurs when a program accesses memory it is not allowed to">segmentation fault</abbr> and resulting in the program being forcefully terminated. This particular ocurrence is known as a <abbr title="A situation occuring when the stack runs out of space, typically due to excessive recursion or deeply nested function calls">**stack overflow**</abbr>.

> We could achieve a correct `factorial` like so:
> ```cpp
> int main() {
>   std::cout << factorial(4) << "\n";
>   return 0;
> }
> 
> ---
> int factorial(int n) {
>   if (n == 0) return 1;
>   return n * factorial(n - 1);
> }
> ---

Just like adding and removing from the top of a stack of plates is hassle-free, pushing/popping stack frames is an extremely efficient operation. However, the stack has a number of important limitations to keep in mind:

* The sizes of local variables must be strictly known at compile time. For example, creating an array of `n` integers, where `n` is read in from `std::cin`, is not allowed in C++[^2].
* As discussed previously, the stack has a limited amount of space, so storing very large objects here (such as large arrays, lookup tables, etc.) is infeasible.
* The lifetime of local variables is bound to the lifetime of their containing function. You cannot create a variable inside a stack frame that will outlive the invocation of its function, since everything in the stack frame will be deallocated when the function finishes execution.

[^2]: TODO: Info about how this is not a fundamental requirement, was allowed in C, etc.

To get around these limitations, we can make use of a different region of memory: the heap.

### The Heap

The **heap** (also known as the **free store**) stores variable-sized chunks of memory that can persist beyond the lifetime of function calls. It overcomes the aforementioned limitations of the stack, at the cost of being a bit less performant and requiring additional effort to manage on behalf of the programmer. 

The heap works kind of like a restaurant front desk. When you enter, you state the number of people in your party and the restaurant finds an empty table that fits everyone and leads you there. The restaurant would like to match you with a table that is exactly the right size for your party&mdash;however, if you are a party of two and there are only tables for three, a table of three will still suffice! On the other hand, if all of the tables are full, they might tell you to come back at another time. Once you are seated, if someone in your group arrives late, they can ask where you've been seated to find you. Eventually, you will finish your meal and leave the restaurant, at which point your table becomes available for future patrons.

In the same way, when you request memory from the heap, an **allocator** must search internally for an unutilized region that is at least as large as the amount you requested&mdash;however you might get something larger! If no sufficiently large contiguous chunk is available, the allocator signals a failure to fulfill the request. If the request was processed, it responds with a **pointer** to the newly-allocated region of memory so that you can manipulate its contents and refer back to that region in the future. Once you are finished using this memory, you can return it back to the allocator (via the pointer to the region) to free it up for future requests.

Having a separate heap addresses all of the limitations of the stack:

* Since the allocator is a runtime construct, you can allocate any sized chunk of memory&mdash;including one whose size will not be known until runtime.
* The heap is typically much, much larger than the stack, allowing for very large chunks to be allocated.
* An allocation created on the heap exists independently of the stack frames. A chunk can be allocated in one stack frame only to be deallocated in a different one.

Using memory on the heap is typically slower than using memory on the stack. On the one hand, this is because allocating on the heap requires the allocator to search for an open location, whereas the stack merely needs to push onto whereever the top of the stack is currently located. On the other hand, heap memory can become fragmented and more widely dispersed than stack memory due to the way its allocated. Continuing the restaurant analogy, imagine a server delivering orders to tables. It's more efficient to deliver all food to one table before continuing on to the next. Bringing one dish to table A, then another to table B, then another to table A again, would require more trips and be a slower process. By the same token, a processor can do its job faster if it accesses memory that tends to be closer together (e.g. the stack) than more widely distributed (the heap). This is known as the **principle of locality**.

As previously mentioned, we must keep track of **pointers** to the allocated chunks to manipulate their contents and to eventually free them up for future use. How do pointers work in C++?

## Pointers


