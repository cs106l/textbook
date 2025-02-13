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

As previously mentioned, we must keep track of **pointers** to the allocated chunks to manipulate their contents and to eventually free them up for future use. But what are pointers and how do they work in C++?

## Pointers

A **pointer** in C++ is both the address of an object in memory, and the way we represent that address in code. In byte-addressable memory (which most computers use), each <abbr title="The smallest addressable unit of memory in most computer systems, typically consisting of 8 bits">byte</abbr> in the program's address space is identified by a number starting from zero and counting upward by one&mdash;the *address* of each byte. An object may span multiple bytes in memory, in which case the address of the entire object is the address of its first byte (i.e. the one with the lowest address). For example, on most systems, an `int` takes up 4 bytes or 32 bits of space. If we were to inspect the memory of a single integer, we might see something like this:

```cpp
int main() {
  int x = 106;
  return 0;
}
```

```memory

#label subtitle "On a particular run of this program, the memory for `x` started at address `0x7fff4a5ff71c`. Note that addresses are typically written in hexadecimal notation (base 16), as opposed to decimal (base 10), for brevity. The first byte of `x` is `01101010`, the binary equivalent of `106`. The memory above and below `x` is unknown, and could take on any value."

0x7fff4a5ff71a = ????????
0x7fff4a5ff71b = ????????

main:
0x7fff4a5ff71c = 01101010
0x7fff4a5ff71d = 00000000
0x7fff4a5ff71e = 00000000
0x7fff4a5ff71f = 00000000

other(""):
0x7fff4a5ff720 = ????????
0x7fff4a5ff721 = ????????

#style:value highlight main
```

We can get a pointer to `x` using `operator&` (known as the **address-of operator**), which takes in a variable and returns the pointer to that variable (i.e. the address of that variable). Consider a slightly modified version of the above snippet:

```cpp
int main() {
  int x = 106;
  `[int* x_ptr = &x;]`
  return 0;
}
```

```memory
conceptual {
  #label title ""
  #label subtitle "`x_ptr` is a pointer to `x`. Conceptually, we can think of `x_ptr` as *pointing* to wherever `x` is located in memory."

  main:
  x = 106
  x_ptr = &main.x

  #style:row highlight main.x_ptr
  #style:link { endSocket: right } main.x_ptr
}

actual {
  #label title ""
  #label subtitle "In reality, `x_ptr` stores the address of `x`. More specifically, `x_ptr` is itself is a number whose value is the address of the first byte of `x`. Notice that `x_ptr` takes up 8 bytes of space (in fact, on a 64-bit system, all pointers take up 8 bytes of space)."

  0x7fff4a5ff71a = "????????      "
  0x7fff4a5ff71b = ????????

  main:
  0x7fff4a5ff71c = 01101010
  0x7fff4a5ff71d = 00000000
  0x7fff4a5ff71e = 00000000
  0x7fff4a5ff71f = 00000000
  0x7fff4a5ff720 = 0x7fff4a5ff71c

  other(""):
  0x7fff4a5ff728 = "????????      "
  0x7fff4a5ff729 = ????????

  #style:row highlight main[-1]
}

caption {
  #label title ""
  #label subtitle "In all future diagrams in this textbook, we will use arrows to represent pointers, but remember, a pointer is just a number containing the address of the thing it points to!"
}
```

If we were to print out `x_ptr` in the code above, we would simply see the address it contains (`0x7fff4a5ff71c`). However, given a pointer, we can *dereference* it to get the actual value it points to:

```cpp
int main() {
  int x = 106;
  int* x_ptr = &x;

---
std::cout << x << "\n";       // Prints 106
std::cout << x_ptr << "\n";   // Prints 0x7fff4a5ff71c
std::cout << *x_ptr << "\n";  // Prints 106
---

  return 0;
}
```

We will now discuss the syntax of pointers, including how they are dereferenced.

### Pointer Types

For any type `T`, `T*` is the type of a pointer to an object of type `T`. Under the hood, every pointer is represented as an address to the starting-byte of an object&mdash;so why include information about the type? Remember that C++ is a [type-safe language](./types-and-structs), so it matters whether the object we're pointing to is an `int` or a `std::string` as it will change what operations are supported for the pointed-to object.

> On 64-bit systems, the size of a pointer will always be 64 bits (8 bytes). On 32-bit systems, a pointer will take up 32 bits (4 bytes). In effect, this places an upper bound on the amount of memory a program can utilize&mdash;a program on a 32-bit machine can at most address $2^{32}\text{B}\approx4\text{GB}$. In fact, this was one of the driving motivations for moving to 64-bit machines: they can address (and therefore make use of) much more memory![^3]

[^3]: In reality, 64-bit machines cannot address $2^{64}$ bytes of memory, even if there was a way to store that much space on device (at this point, there is not&mdash;$2^{64}\text{ bytes}\approx18\text{ exabytes}$, or about 18 billion gigabytes). 64-bit CPUs will typically only use some portion of the address bits (for example, Intel processors commonly use only the lower 48 bits for architectural reasons).

Given a `T*` ptr, we can get the value of type `T` that it points to through the **indirection operator**, `*`. This is known as *dereferencing* a pointer. To be precise, `operator*`, returns a `T&`, or a reference to `T`. Why? This technicality means that dereferencing a pointer does not make any copies of the pointed-to object&mdash;it merely accesses its already-existing memory. Furthermore, it allows us to use the indirection operator to modify the underlying data, e.g.:

```cpp
int main() {
---
int x = 106;
int* x_ptr = &x; `[]`
*x_ptr = 107; `[]`
---
  return 0;
}
```

```memory
L1 {
  main:
  x = 106
  x_ptr = &main.x

  #style:link { endSocket: right } main.x_ptr
}

L2 {
  #label subtitle "Since indirection returns an `int&`, we can modify `x` through `x_ptr`, changing it from `106` to `107`."

  main:
  x = 107
  x_ptr = &main.x

  #style:link { endSocket: right } main.x_ptr
}
```

If `T` happens to be a structure, e.g. an `std::pair<double, double>`, we can directly access its members through the **member access operator**, `operator->`. This is the same as first dereferencing the pointer and then accessing the member. For example:

```cpp
int main() {
---
std::pair<double, double> my_pair { 10, 20 };
auto* ptr = &my_pair; `[]`
double second = ptr->second; `[]`    // Same as (*ptr).first
---
  return 0;
}
```

```memory
L1 {
  #label subtitle "`ptr` points to `my_pair`. Note the use of `auto` to have the compiler infer the type"

  main:
  my_pair = "pair<double, double>" { first: 10, second: 20 }
  ptr = &main.my_pair.second

  #style:link { endSocket: right } main.ptr
}

L2 {
  #label subtitle "The `->` operator *dereferences* a specific member within the pointed-to object."

  main:
  my_pair = "pair<double, double>" { first: 10, second: 20 }
  ptr = &main.my_pair.second
  second = 20

  #style:link { endSocket: right } main.ptr
}
```

Every `T` also has a *pointer-to-const* type, `const T*` (also written `T const*`) which represents a pointer to a `const T`. We cannot change the contents of the object pointed to by this kind of pointer. However, we can change what the pointer itself points to. For example:

```cpp
int main() {
---
int x = 106;
int y = 107;

const int* ptr = &x;
// *ptr = 107;        // Not allowed, `ptr` points to `const int`
ptr = &y;             // However, we can change where `ptr` points to
---
  return 0;
}
```

Indeed, if we wanted to prevent the pointer itself from being changed, we could use a *const-pointer*, e.g. `T* const`. The pointer itself cannot be changed (i.e pointed to a different object), but we can still change the underlying object itself. Hence, every `T` has four pointer types, represented in the table below:

| | **non-`const` Pointee** | **`const` Pointee** |
|-|---------------------|---------------------|
| **non-`const` Pointer** | `T*` | `const T*` <sub>(or `T const*`)</sub> | 
| **`const` Pointer** | `T* const` | `const T* const` <sub>(or `T const* const`)</sub> |

There is a special value, `nullptr`, which represents a pointer to no object. It is commonly used to represent the absence of a value. `nullptr` can be cast to any of the above pointer types and any type `T`, and under the hood, `nullptr` always stores the special address `0`. **Be careful! You cannot dereference a `nullptr`** as it doesn't point to any object. Attempting to do so, whether through `operator*` or `operator->`, will result in a segmentation fault.

```cpp
int main() {
---
int* ptr = nullptr;

// Either of these commented lines would crash:
//  int x = *ptr;
//  *ptr = 106;
---
  return 0;
}
```

```memory
#label subtitle "In this textbook, we will represent `nullptr` with a `⦻` character in diagrams."
main:
ptr = null
```

In C++, `nullptr` has a special type, `nullptr_t`. The only instance of `nullptr_t` is `nullptr`, and it automatically converts into an instance of any pointer type.


### Pointers to The Heap

> **⚠️ Note:** In modern C++, it is no longer recommended to use raw pointers, e.g. `T*`, to refer to heap allocations, as this can lead to memory leaks if you forget to deallocate them. Consider using *smart pointers* instead, such as `unique_ptr` and `shared_ptr`, which automatically deallocate. These will be discussed in a later chapter.

So far, the examples we have shown have included pointers to regions of the stack, e.g. `x_ptr` which points to a local variable `x`. This is uncommon in C++, as references (discussed in a previous chapter and more below) are more commonly used to accomplish the same thing. Where you may see pointers more often used is to refer to allocations on the heap. As discussed previously, the heap stores dynamically allocated memory that can outlive a function invocation. To allocate an object of type `T` on the heap, we can request it from the allocator using `operator new`:

```cpp
T* ptr = new T;
```

**Note that this version of `new` does not initialize `T`.** It's memory will be whatever was left in the allocated chunk, typically garbage data. Going back to the restaurant example discussed previously, it's as if the restaurant sat you down at an open table without clearing the dishes from the previous guests! To actually initialize the object, you can use uniform initialization, e.g.

```cpp
T* ptr = new T { /* Args to initialize T */ };
```

or <abbr title="When an object is explicitly initialized with empty braces {} or () (e.g., T{} or T()), zero-initializing fundamental types (double, int, etc.) and invoking the default constructor for class types if available">value initialization</abbr>: 

```cpp
T* ptr = new T();
```

To see the difference, consider the case where `T = std::pair<int, double>`:

```cpp
auto ptr1 = new std::pair<int, double>;
auto ptr2 = new std::pair<int, double> { 106, 3.14 };
auto ptr3 = new std::pair<int, double>();
```

```memory
#label subtitle "We cannot know for sure what `*ptr1` contains, since it wasn't initialized. However, `*ptr2` is definitely initialized with `106` and `3.14`, and `*ptr3` is value initialized with zero-initialized members."

garbage => "pair<int, double>" { first: ????, second: ???? }
known => "pair<int, double>" { first: 106, second: 3.14 }
zero => "pair<int, double>" { first: 0, second: 0 }
ptr1 = &garbage
ptr2 = &known
ptr3 = &zero
```

Once you have a `T*` to the heap, you can deference it, pass the pointer to other functions, store it in another data structure, etc. However, you must remember to *deallocate* the region once you are done with it. This can be done by passing the same pointer returned by `new` to `operator delete`:

```cpp
delete ptr;
```

which frees the memory pointed to by `ptr`. Calling `delete` on a pointer not previously returned by `new` is invalid, as is attempting to `delete` the same pointer twice. The one exception to this rule is `nullptr`: `delete`ing `nullptr` is always valid and does nothing. Failing to `delete` a pointer that was allocated with `new` will not cause your program to crash, but will lead to a <abbr title="When dynamically allocated memory (via new) is not properly deallocated (delete), leading to wasted memory that remains inaccessible until the program terminates">**memory leak**</abbr>, causing your program to use more memory than it requires.

Often times, we don't want to allocate space for a single object, but for multiple objects at a time. C++ supports this through **array allocations** and `operator new[]`:

```cpp
T* ptr = new T[n];
```

The snippet above allocates a *contiguous* region of memory large enough to hold `n` instances of `T`. Importantly, `n` can be a dynamically determined value&mdash;it does not need to be known at compile time, allowing us to overcome the static-size constraint placed on stack memory/local variables. This syntax also does not initialize any of the elements in the region. If we wanted to initialize the elements, we can use:

```cpp
T* ptr1 = new T[n]();
T* ptr2 = new T[n] { t1, t2, /* ... */, tn };
```

For example, consider the contents of memory produced by this code:

```cpp
double* ptr0 = new double[5];
double* ptr1 = new double[5]();
double* ptr3 = new double[5]{ 1, 2, 3, 4, 5 };
```

```memory
a0 => b"?????"
a1 => b"00000"
a2 => b"12345"

ptr0 = &a0
ptr1 = &a1
ptr2 = &a2
```

**When allocating an array with `new[]`, you must use the corresponding `delete[]` when you are finished with it.** Attempting to deallocate such a pointer using `delete` (without the `[]`) is invalid.

```cpp
T* ptr = new T[n];
delete[] ptr;
```

> **Note:** There is no difference syntactically between a pointer to an object and a pointer to an array. The programmer is responsible for knowing the difference between the two and using the appropriate operations, e.g. calling the right version of `delete` on it.

### Pointer Arithmetic

Given an array pointer `T*`, how do we access the $i^\text{th}$ element? One way is using <abbr title="Allows performing operations like addition and subtraction on pointers, enabling traversal of arrays and dynamic memory by leveraging the underlying memory addresses">**pointer arithmetic**</abbr>, which makes use of two key facts:

* Every type `T` has a fixed size at compile time.
* Array allocations (returned by `new[]`) are contiguous in memory.

The first fact enables the compiler to know precisely how many bytes to allocate to an array of `n` elements of type `T`&mdash;indeed, we can call `sizeof(T)` to get the compile-time size of `T`, so `n * sizeof(T)` is the *minimum* number of bytes a call to `new T[n]` must allocate. The second fact, in combination with the first, enables us to access individual elements in arrays. As the example below demonstrates, adding an integer to a pointer increments that pointers address *in multiples of `sizeof(T)`*:

```cpp
int main() {
---
int* arr = new int[4]();
int* ptr_to_2nd = arr + 1;
int* ptr_to_3rd = arr + 2;
---
  delete[] arr;
  return 0;
}
```

```memory
conceptual {
  #label title ""
  #label subtitle "`arr` points to the beginning of the allocated array. Adding `1` to `arr` gives a pointer to the element `1` after `arr` in memory, `2` gives the pointer `2` after `arr`, etc."

  data => b"0000"
  arr = &data
  ptr_to_2nd = &data[1]
  ptr_to_3rd = &data[2]

  #style:link { path: straight } arr
  #style highlight data[::2]
}

actual {
  #label title ""
  #label subtitle "Under the hood, adding an integer to a number adds or subtracts `sizeof(T)` multiples of bytes from its underlying address. In this case, `sizeof(int) = 4`, so `arr + 1`, for example, adds 4 bytes to `arr`'s underlying address."

  heap => {
    0x7ffffd098f16: ????????,
    0x7ffffd098f17: ????????,
    0x7ffffd098f18: 00000000,
    0x7ffffd098f19: 00000000,
    0x7ffffd098f1a: 00000000,
    0x7ffffd098f1b: 00000000,
    0x7ffffd098f1c: 00000000,
    0x7ffffd098f1d: 00000000,
    0x7ffffd098f1e: 00000000,
    0x7ffffd098f1f: 00000000,
    0x7ffffd098f20: 00000000,
    0x7ffffd098f21: 00000000,
    0x7ffffd098f22: 00000000,
    0x7ffffd098f23: 00000000,
    0x7ffffd098f24: 00000000,
    0x7ffffd098f25: 00000000,
    0x7ffffd098f26: 00000000,
    0x7ffffd098f27: 00000000,
    0x7ffffd098f28: ????????,
    0x7ffffd098f29: ????????
  }

  main:
  arr = &heap.0x7ffffd098f18
  ptr_to_2nd = &heap.0x7ffffd098f1c
  ptr_to_3rd = &heap.0x7ffffd098f20

  #style:row highlight heap[2:6] heap[10:14]
  #style:link { endSocket: right } main.*
  #style { opacity: 0.75 } heap
}
```

Commonly, we want to access the elements at different positions in an array. Using pointers, we could dereference, e.g. `*(arr + 1)`, to get the element at index `1`. This is a common enough operation that there exists a special syntax just for this purpose: `operator*`. For pointer types, `arr[i]` is exactly the same as `*(arr + i)`.

```cpp
int& elem1 = *(arr + 2);
int& elem2 = arr[2];

// The above two lines are exactly the same.
// elem1 and elem2 refer to the same element!
```

### Relationship to References
