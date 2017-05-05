This is an introduction to [Lean][], a dependently typed programming language oriented toward writing and checking proofs.
Like the more popular [Coq][], Lean is based on the [calculus of inductive constructions][coc], a dependently typed lambda-calculus that is an ideal match for using Curry--Howard to treat types as propositions.
Unlike Coq, Lean is a pretty new language that has a friendly [in-browser interactive interface][leanweb].

For more detail on Lean, try going through the three in-progress tutorials it comes with: [*An Introduction to Lean*][intro], [*Theorem Proving in Lean*][tpil], and [*Programming in Lean*][pil].
This shorter tutorial steals shamelessly from those.
For even more on using proof assistants to study programming languages, I recommend [*Software Foundations*][sf], which has you do 6110-like proofs and other work using Coq.

[leanweb]: https://leanprover.github.io/programming_in_lean/?live
[coc]: https://en.wikipedia.org/wiki/Calculus_of_constructions
[pil]: https://leanprover.github.io/programming_in_lean
[tpil]: https://leanprover.github.io/documentation/
[intro]: https://leanprover.github.io/introduction_to_lean/
[lean]: https://leanprover.github.io
[coq]: https://coq.inria.fr
[sf]: https://www.cis.upenn.edu/~bcpierce/sf/current/index.html


# Definitions, Evaluation, and Type Checking

Like any good functional programming language, Lean lets you define data types. We can define the natural numbers using this `inductive` declaration:

    inductive nat' : Type
    | zero : nat'
    | succ : nat' -> nat'

(I'm using the name `nat'` instead of just plain `nat` because Lean has a built-in `nat`.)
This data type definition is roughly equivalent to this OCaml declaration:

    type nat = Zero | Succ of nat

The declaration is more verbose because it's more flexible than an OCaml data type.
The `: Type` indicates that we're defining a type of values rather than something higher-order (e.g., a kind of types).
Annotating `zero` with `: nat'` and `succ` with `: nat' -> nat'` is a function-like notation that defines the "parameters" to each constructor.
In OCaml, `Zero` implicitly says it takes no parameters and gives you a `nat`; the Lean equivalent says the same thing explicitly.
Similarly, `of nat` is OCaml's way of saying that `Succ` takes another `nat` as a parameter and gives you something else of type `nat`.

To evaluate expressions in Lean, you have to write `eval` before them.
For example:

    eval nat'.succ nat'.zero

If you type this into the Web console for Lean, you'll see the result in the readout pane.
Unsurprisingly, this one evaluates to `nat'.succ nat'.zero`.
You can also define variables with `def`:

    def one' := nat'.succ nat'.zero
    eval nat'.succ one'

That one results in `nat'.succ (nat'.succ nat'.zero)`, i.e., two.
The type of `one'` can be inferred here, but you can also opt to write it explicitly, like this:

    def one' : nat' := nat'.succ nat'.zero

You also use `def` to define functions.
Here's an addition function:

    def add' : nat' -> nat' -> nat'
    | m nat'.zero := m
    | m (nat'.succ n) := nat'.succ (add' m n)

We've declared `add'` to be a function of type `nat' -> nat' -> nat'`.
The `|`s separate two cases: any number `m` and zero, or any number `m` and the successor of some other number `n`.
The latter calls `add'` recursively.
Here's how to call the function:

    eval add' one' (add' one' one')

This gives us the unary representation of three.

Lean also has a cousin to `eval` that shows you the type of an expression instead of its value.
It's called `check`:

    check add' one' nat'.zero
    check add'

The console tells us that the first expression has the type `nat'` and that our function has the function type we expect.


# Propositions

To make things easier to write, we'll now drop our hand-written definition of `nat'` and use Lean's built-in one.
Lean lets us write numbers and infix operations more naturally while still using a data type that looks very much like our `nat'` above:

    def answer : nat := 6 * 7
    check answer
    eval answer

The console shows us `42` instead of the long unary nesting of `succ` constructions.

Let's write our first (very tiny) logical assertion.
It just says that 5 is equal to 5:

    def fiveIsFive := 5 = 5

The infix `=` operator works like a constructor.
If you type `check fiveIsFive`, you'll see that it has type `Prop`.
In Lean, expressions of type `Prop` themselves work as types.
That is, you can write other expressions that, when you `check` them, have types that are values of type `Prop`.
Those term expressions, according to Curry--Howard, work as proofs of the propositions they type-check as.
For example, here's an expression of type `5 = 5`:

    check eq.refl 5

In the Lean standard library, `eq.refl` is just another data type constructor where `eq.refl n` has the type `n = n` for any natural number `n`.
The idea is the same as when we defined `nat'.succ n` to have the type `nat'`.
(You can see how Lean and other dependently-typed languages mix up the notions of terms and types.)

You can write more complicated `Prop`s too.
Here, for example, is the proposition that says that there exists some number that, when added to 2, produces 4:

    def twoExists := exists n, 4 = n + 2

Let's prove something incrementally more complex than 5 = 5.
Using the same syntax as we used for writing ordinary functions above, we can write a function that works as a parameterized proposition to say that a number is square:

    def isSquare (n : nat) := exists m, m * m = n

Typing `check isSquare 4` confirms that providing a number gives you a `Prop`.
To prove this theorem, we need a term whose type is `isSquare 4`.
Here's one:

    check Exists.intro 4 (eq.refl 16)

Lean's type checker tells us that this is a proof of something else, but it also serves a proof of the theorem we want.
To check that, we can give an explicit type to the expression we're proving:

    def proof : isSquare 16 :=
      Exists.intro 4 (eq.refl 16)
    check proof

Now Lean confirms for us: `proof` has the type `isSquare 16`, so we have proven that theorem! Woohoo!


# Dependent List Library

For a more complete example, let's recreate our library of list-related functions from the last lecture.

## Non-Dependent Lists

We can start with a version in Lean that doesn't really use dependent types; this will look more or less like the OCaml equivalent.

    -- An inductive list type *without* lengths
    -- encoded in the type.
    inductive IList : Type
    | nil : IList
    | cons : int -> IList -> IList

    -- Our little library of operations:
    -- head, tail, and a nil check.
    def hd : IList -> int
    | IList.nil := sorry
    | (IList.cons n t) := n

    def tl : IList -> IList
    | IList.nil := sorry
    | (IList.cons n t) := t

    def isnil : IList -> bool
    | IList.nil := tt
    | (IList.cons n t) := ff

    -- Try it out on an example.
    def somelist := IList.cons 5 IList.nil
    eval hd somelist

    -- Here's an example that produces an error.
    eval tl IList.nil

Lean has a special `sorry` expression that lets you apologize for not finishing a definition (often a proof).
Here, we use it as a "run-time error" for cases where `hd` and `tl` fail on empty lists.

## Using Dependent Types

Next, we'll encode the length of the list into the type.
Instead of declaring `IList` as a `Type`, we'll instead declare it as a `nat -> Type` to make it a dependent type.
Recall that this means that client code has to provide a number in order to get a list type:

    inductive IList : nat -> Type
    | nil : IList 0
    | cons {n : nat} : int -> IList n -> IList (nat.succ n)

The curly braces after the `cons` constructor contain the type abstraction parameters. You can think of this as equivalent to the "big pi" we used in our formal language.
Here's how you construct a list:

    def somelist := IList.cons 5 IList.nil
    check somelist

Notice that we didn't write the `1` that forms the type of the list---even so, Lean tells us that `somelist` has the type `IList 1`.
It uses type inference to automatically invent that parameter.

Our library of operations also adds `{n : nat}` to take a length parameter in each case.
Wherever we wrote `IList` above, we now append an argument:

    def hd {n : nat}: IList (nat.succ n) -> int
    | (IList.cons h t) := h

    def tl {n : nat} : IList (nat.succ n) -> IList n
    | (IList.cons h t) := t

In both cases, Lean is smart enough to know that we no longer need a case for `IList.nil`!
If we left that off of the definitions in the previous version, we would get a "non-exhaustive match" error.
So long, `sorry`.

Armed with these definitions, let's try some operations on lists:

    eval hd somelist
    check tl somelist
    check tl (tl somelist)  -- Error!

The `hd` and `tl` functions work using the same syntax as before---Lean can infer all the length parameters for us.
But if we even try to *type-check* the expression that gets the tail of our one-element list twice, we get an error.
The type system prevents us from ever running off the end of the list!

If you want to explicitly provide those length parameters, lean has an @ expression that "reveals" the implicit parameters. For example, here's how we would explicitly provide length arguments to `hd` and `tl`:

    eval @hd 0 somelist
    check @tl 0 somelist

We provide a 0 in both cases to indicate that we're passing in a list of length 1.
Trying to provide any other number there results in a type error.
