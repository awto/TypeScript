/// <reference path="../types.ts" />
/// <reference path="../factory.ts" />
/// <reference path="../visitor.ts" />
/// <reference path="../checker.ts" />
/// <reference path="../utilities.ts" />

/*@internal*/
namespace ts {
    export function resolveImplicits(context: TransformationContext) {
        return transformSourceFile;
        function transformSourceFile(node: SourceFile): SourceFile {
            if (node.isDeclarationFile) {
                return node;
            }
            return <SourceFile>visitor(node);
        }
        function visitor(node: Node): Node {
            switch (node.kind) {
            // workaround lexical environment suspension
            case SyntaxKind.FunctionType:
                return node;
            case SyntaxKind.QueryImplicit:
                return (<QueryImplicit>node).resolvedExpression || createIdentifier("undefined");
            case SyntaxKind.CallExpression:
                const call = <CallExpression>node;
                let result = <CallExpression>visitEachChild(node, visitor, context);
                if (call.resolvedImplicitArguments && call.resolvedImplicitArguments.length)  {
                     result = createCall(result.expression, result.typeArguments,
                         call.resolvedImplicitArguments.concat(result.arguments));
                }
                if (call.implicitCast !== undefined) {
                    result = createCall(call.implicitCast, /* typeArguments */ undefined, [result]);
                }
                return result;
            case SyntaxKind.ImplicitKeyword:
                return undefined;
            default:
                if (isExpression(node)) {
                    const expression = <Expression>node;
                    let result = <Expression>visitEachChild(expression, visitor, context);
                    if (expression.implicitCast !== undefined) {
                        result = createCall(expression.implicitCast, /* typeArguments */ undefined, [result]);
                    }
                    return result;
                }
                return visitEachChild(node, visitor, context);
            }
        }
    }
}