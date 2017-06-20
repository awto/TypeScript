# TypeScript with implicits

The project is a near-HEAD fork of [TypeScript](http://www.typescriptlang.org/) adding support of Scala-like implicits. And it is same TypeScript compiler unless  `--implicits` is specified. 

The extension doesn't require any runtime support, it is easy to debug, result can be immediately 
seen in generated JS, and it is fairly small change to language syntax and semantics.

## Installing

It can be installed from npm using `typescript-with-implicits` name. 
```
npm install -g typescript-with-implicits
```

WARNING: executable name isn't changed, but it is the same TypeScript if used 
without `--implicits` option.

## Description

There are only two small syntax extensions. For declaring implicit definition add keyword `implicit` before any `const`/`let` variable declaration or function's parameter. After the value may be queried by its type with the new `??` expression. 

For example here is some result of translation:

```typescript
implicit const num = 10
?? as number
```

in ES6:

```javascript
const num = 10
num
```

The `??` expression is similar to variable name referring some value, but instead of its name it refers values by its type. The resolution runs at fully at compile time.

Explicit type annotation with `as` expression is optional in queries if type checker can infer the type itself. In most cases, it can.

```typescript
implicit const num = 10
?? + 2
```

is converted into:

```javascript
const num = 10
num + 2
```

The implicit declaration is still same plain variable declaration. The variables it declares may be referred by name as well. It also respects block scoping rules.

Function parameters can also have `implicit` modifier:

```typescript
function plus(implict n: number, m: number) {
    return ?? + m
}
```

This is translated into:

```javascript
function plus(n, m) {
    return n + m
}
```

When calling functions with implicit parameters the parameters aren't specified, they are rather automatically initialized with `??` expression by the compiler. 

```typescript
implicit const v = 10
plus(10)
```

Here `plus(10)` is equivalent to `plus(??, 10)` and so resulting code will be:


```javascript
const v = 10
plus(v, 10)
```

But it is still same javascript function's parameter so, Function's object call/apply methods expect the full list of arguments with implicit ones.

There is no way now to pass some other not-query value to an implicit argument. 

If an implicit declaration is a function without non-implicit parameters, the search  will try to match its return type, and substitute its call in place of the current query, recursively resolving its implicit parameters if there are any.

```typescript
implicit const num = (implicit t: boolean) => t ? 10 : 20
implicit const t = true
?? as number
```
translated to:

```javascript
const t = true
const num = (t) => t ? 10 : 20
num(t)
```

To avoid non-termination only specific number of such applications will be tried.  The number is defined by `--maxImplicitsStack=N` argument, by default it is 10 now.

If `--implicitCasts` option is specified, implicits definitions having function's type with only one non-implicit parameter has a special meaning. The checker will try to solve typing problems by applying the function to values with types not matching  their context type. For example:

```
implicit const strToNum = (str: string) => +str;
function a(i: number): void {
// ....
}
a("a");
let n: number = "a";

```

translated to:

```javascript
implicit const strToNum = (str: string) => +str
function a(i: number): void {
// ....
}
a(strToNum("a"))
let n: number = strToNum("a")
```


Currently implemented in the prototype casts resolution doesn't work in any context, just function's  arguments, `as`, variable declarations initialization. Also in some next version, it could try to convert function's type expressions if arguments or return types don't match context, but have applicable casts in scope.

Obviously, there is little use for implicit values with such simple types like  numbers/booleans. So there is a real example. Let's implement generic Monoid structure. Monoid on some type is a structure consisting unit element and a binary operation (conforming monoid laws, but it is not significant here),  in TS this may be defined like:

```typescript
interface Monoid<T> {
    unit: T;
    add:  (a: T, b: T): T;
}
```

For example definitions for number monoids 1/* and 0/+.

```typescript
const multMonoidDef = {
    add: (l: number, r: number) => l * r,
    unit: 1
};

const sumMonoidDef = {
    add: (l: number, r: number) => l + r,
    unit: 0
};

```

Note, because of structural typing we don't even have to declare the values to be an instance of `Monoid` interface.

And another generic definition for Array's monoid:

```typescript
const arrMonoidDef = <T>(): Monoid<T[]> => ({
    add: (l: T[], r: T[]) => l.concat(r),
    unit: []
});
```

Now we can implement abstract functions working on any monoid,  for example reducing an array of values into a single value:

```typescript
function arrReduce<T>(implicit m: Monoid<T>, arr: T[]): T {
    return arr.reduce((a, b) => ??.add(a, b), ??.unit);
}
```

And the usage:

```typescript
implicit const arrMonoid = arrMonoidDefAbs
implicit const numMonoid = multMonoidDef
const n = arrReduce([1, 2, 3, 4])
const m = arrReduce([[1, 2], [3, 4]])
{
   implicit const numMonoid = sumMonoidDef
   const n = arrReduce([1, 2, 3, 4, 5])
}
```

Note the block scoped value, changing default number monoid from 1/* to 0/+.


There are a few problems implementing the same in JS. For monoid's `unit` function, we would have to thread monoid definitions through each call with function's parameters, 
or use a single global variable, and switch its value when needed.  Both approaches are obviously very error-prone.

It is not a problem for `add` method. It is more idiomatic in JS to define it in monoid value's prototype, so the reference is passed with the value everywhere.
However, in TS this approach also has a problem. It cannot restrict the second argument to have the same type as the first (in `this`). With implicits, it is not a problem. Calling `add` with, say, number and Array will report error at compile time.

What about probably the Haskell's most famous Monad type class? It is not 
straightforward but still possible to define as implicit. The main problem 
is TypeScript doesn't have higher-kinded type variables. And it is not even 
possible define Monad's definition interface to use in implicits. Here is an
example of invalid TypeScript code:

```typescript
interface Monad<M> {
   of<A>(v:A): M<A>;
   chain<A,B>(a:M<A>, f:(v:A) => M<B>): M<B>;
}
```

Unfortunately, type variable `M` cannot receive another type arguments. Fortunately, there
is not very nice but still a solution. Implicit casts  may be used to convert to a special type:

```
interface App<M, A> {
    // trying to simulate nominal type with invariant (maybe in some future) parameters
    _appBrand(m: M, a: A): { m: M, a: A };
}
```

There should not be any value of this type. It is used only in abstract functions.

And the instance:

```typescript
interface Monad<M> {
    chain: <A, B>(arg: App<M, A>, fn: (arg: A) => App<M, B>) => App<M, B>;
    of: <A>(v: A) => App<M, A>;
}
```

And, say, we want to define Array as Monad:

```typescript
implicit const arrToApp = <A>(i: Array<A>) => <App<Array<any>, A>>(<any>i);
implicit const appToArr = <A>(i: App<Array<any>, A>) => <Array<A>>(<any>i);

let mArrImpl: {
    chain: <A, B>(v: A[], f: (v: A) => B[]) => B[],
    of: <A>(v: A) => A[]
};

implicit const monadAppArr: Monad<any[]> = {
    chain: <A, B>(v: App<any[], A>, f: (v: A) => App<any[], B>): App<any[], B> => {
        return mArrImpl.chain(v as A[], (i) => f(i) as B[]);
    },
    of: <A>(v: A): App<any[], A> => {
        return mArrImpl.of(v);
    }
};

```

And an abstract function working for any Monad:

```typescript
declare function liftM2<M, A, B, C>(implicit m: Monad<M>, f: (a: A, b: B) => C, a: App<M, A>, b: App<M, B>): App<M, C>;
```

Once implemented it will work for any Monad, like Array, Promise, Observable etc.

This may be used with array's arguments directly by means of implicit casts:

```typescript
const res: number[] = liftM2((a: number, b: number) => a + b, [1], [2])
```

The result will contain a lot of cast functions applications. Another simple translation
pass inlining some functions could resolve this. 

## Overlapping instances

This implementation just searches backward from a query until it finds the matching type, and stops there. If it is an implicit function requiring its argument resolution,  and some of its parameters cannot be resolved the search will stop and report an error.

There are quite a few alternatives, not implemented yet:

### require only one declaration match

It is the safest solution, but too restrictive.

### resolve conflict by specificity, 

With sub-types/union/intersections and type predicates, it is hard to define 
such specificity and I suppose it is even harder to reason about it in real 
applications if defined.

### backtrack if some implicit parameter of implicit function aren't resolved

This will make the resolution to be a fully featured logical compile-type 
meta-programming language, arguably if it is a good idea or bad to support. It's 
much harder to reason about results. Now in a case of a problem user gets some full stack trace of the resolution process, in the case of backtracking we cannot guess if the error was planned or it is indeed a problem to report. Some traces output may partly solve the problem, but in cases where backtracking can be useful, the traces may be huge.

## Modules

Nothing is done in the prototype for modules support yet. If I continue to work on this tool, I will implement imports in the form of an additional syntax for statements: `open implicits Name`, where Name may be either imported module name, or namespace or even an object with implicit fields. The statement is equivalent to emplacement of variable definition copying all implicit values from imported value. For example module "./mod1" exports two implicit variables "a" and "b".

```typescript
import * as M from "./mod1"
.....
function f() {
   open implicits M;
};
```

will be translated into:

```typescript
import * as M from "./mod1"
.....
function f() {
   const temp_a = M.a, temp_b = M.b;
};
```

This way the values may be imported locally in blocks, and their order can be changed, while if `import` statement is extended with implicits support there will be no means to specify scope or order.

## Current state

The prototype was implemented only for experimental purposes. Now at least the specified examples work. 

There are problems, as TS checker isn't designed for such usages, for example, object literal doesn't fully instantiate all type arguments, sometimes more type annotations are required etc. But if the suggestion is somehow accepted I suppose the problems are not difficult to fix.
