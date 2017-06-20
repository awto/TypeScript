//// [implicitsResolveDiagnostics.ts]
implicit var avar: number;
implicit function a2(a1: number, implicit a2:number) { return a1 + a2; }

implicit function a(arg1: number, implicit arg2: number) {
implicit const n = 10;
implicit const fna = <T>(implicit n: T) => ({ value: n });
implicit const fnb = <T>(implicit n: { value: T }) => ({ val: n.value });

{
        const n = 20;
        ?? as {val: number };
        ?? as {val: string };
        ?? as string;
}
implicit let cycle: <T>(implicit arg: T[]) => T;
?? as number;
implicit const num = (implicit t: boolean) => t ? 10 : 20
implicit const t = true
?? as number;

function plus(implicit a: number, b: number): number {
    return a + b;
}


//// [implicitsResolveDiagnostics.js]
var avar;
function a2(a1, a2) { return a1 + a2; }
function a(arg1, arg2) {
    var n = 10;
    var fna = function (n) { return ({ value: n }); };
    var fnb = function (n) { return ({ val: n.value }); };
    {
        var n_1 = 20;
        undefined;
        undefined;
        undefined;
    }
    var cycle;
    undefined;
    var num = function (t) { return t ? 10 : 20; };
    var t = true;
    num(t);
    function plus(a, b) {
        return a + b;
    }
}
