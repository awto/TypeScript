// @implicits: true
// @implicitCasts: true
interface App<M, A> {
  _appBrand: {m:M,a:A};
}

implicit const arrToApp = <A>(i: Array<A>) => <App<Array<any>, A>>(<any>i);

implicit const appToArr = <A>(i: App<Array<any>, A>) => <Array<A>>(<any>i);

interface Monad<M> {
  chain: <A, B>(arg: App<M, A>, fn: (arg: A) => App<M, B>) => App<M,B>;
  of: <A>(v: A) => App<M,A>;
}

declare function liftM2<M,A,B,C>(implicit m: Monad<M>, f: (a: A, b: B) => C, a: App<M, A>, b: App<M, B>): App<M,C>;

function liftM<M,A,B>(implicit m: Monad<M>,
                      f: (a: A) => B, a: App<M, A>): App<M,B> {
  return ??.chain(a, (v: A) => ??.of(f(v)) as App<M, B>);
}

let mList: {
  chain: <A, B>(v: A[], f: (v: A) => B[]) => B[],
  of: <A>(v: A) => A[]
};

implicit const appList: Monad<any[]> = {
  chain: <A, B>(v: App<any[],A>, f: (v: A) => App<any[],B>): App<any[],B> => {
    return mList.chain(v as A[], (i) => f(i) as B[]);
  },
  of: <A>(v: A): App<any[],A> => {
    return mList.of(v);
  }
};

const liftMRes: number[] = liftM((a:number) => 10*a, [1]);
const liftM2Res: number[] = liftM2((a:number, b:number) => a + b, [1], [2]);

function strToNumCheck() {
  implicit const strToNum = (str:string) => +str;
  function a(i:number):void {
  }
  a("a");
  let n: number = "a";
}

implicit const c1 = <T>(implicit t: T) => ({value:t});
implicit const c2 = 2;
const e1 = <T>(implicit t: {value:T}) => ({value:t.value});
declare function e2<T>(implicit t: {value:T}, v: T): void;
declare function e3<T>(v:{value: T}): {value:T};
declare function e4(v:{value:number}): void;
let a: {value: number} = e1(); // => e1(c1(c2));
a = ??;                     // => a = c1(c2);
e2(10);                        // => e2(c1(c2),10)
// a = e3(??);                 // => a = e3(c1(c2))
e4(??);                     // => e4(c1(c2))
e4(e1());                      // e4(e1(c1(c2)));

implicit const some1 = { fun(a:{value:number}) { return a.value + 1; } };
implicit const some2 = 2;
implicit const some3 = (implicit a: number) => ({value:a+1});

?? as number;
const n: number = ??.fun(??)

function b() {
  implicit const f = function f<A>(x:A):A { throw new Error(); }
  implicit const g = function f(n:number):number { return n + 1; };
  ??(1) // ===> g
}

function c() {
  implicit const a: number = 1;
  implicit const b: boolean = true;
  implicit const c = (implicit n: boolean) => n ? 2 : 0;
  return ?? as number; // ===> c(b)
}

function d() {
  implicit const c = function c<T>(n:T):T { throw new Error(); }
  const b:number = ??(1) // ==> c(1)
  const bR:number = c(1)
}

function e() {
  implicit const c = <T>(implicit  v:{value:T}, implicit c: {value:boolean}, n:T) => c.value ? v.value : n
  implicit let a = {value: 10}
  implicit let f = {value: true}
  const e: number = 1
  const b1:number = ??(e) // ==> c(a,f,e)
}

function f() {
  implicit const g = function f<T>(n:{value:T}):{value:T} { return n; };
  ??({value:1}) // ===> g
}

interface Monoid<T> {
  add: (a: T, b: T) => T;
  unit: T;
};

const multMonoidDef = {
  add: (l: number, r: number) => l * r,
  unit: 1
};

const sumMonoidDef = {
  add: (l: number, r: number) => l + r,
  unit: 0
};

const arrMonoidDefAbs = <T>(): Monoid<T[]> => ({
  add: (l: T[], r: T[]) => l.concat(r),
  unit: []
});

function arrReduce<T>(implicit m: Monoid<T>, arr: T[]) {
  return arr.reduce((a, b) => ??.add(a, b), ??.unit);
}

function monoidsTest() {
  implicit const arrMonoid = arrMonoidDefAbs;
  implicit const numMonoid = multMonoidDef;
  const n = arrReduce([1,2,3,4]);
  const m = arrReduce([[1,2],[3,4]]);
  {
    implicit const numMonoid = sumMonoidDef;
    const n = arrReduce([1,2,3,4,5]);
  }
}
