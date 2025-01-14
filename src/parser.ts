import { NFAAutomaton,AutomatonEdge } from './automaton.js';
import { assert } from './tools.js';
export interface Token {
    type: string;
    value: any;
}
export interface YYTOKEN extends Token{
    yytext:string;
}
export interface Lex {
    yylex(): YYTOKEN;
    yyerror(msg: string): any;
}
export class ParseException extends Error{
    constructor(msg:string){
        super(msg);
        super.name='ParseException';
    }
}
export default function Parse(lexer: Lex):any {
    let state: { [key: string]: string | undefined }[] = JSON.parse(`[{"exp":"s1","exp_unit":"s2","[":"s3","ch":"s4","(":"s5"},{"$":"r0","exp_unit":"s2","exp":"s6","|":"s7","[":"s3","ch":"s4","(":"s5"},{"(":"r1","[":"r1","|":"r1","$":"r1","ch":"r1","+":"s8","*":"s9"},{"union_units":"s10","^":"s11","union_unit":"s12","ch":"s13"},{"(":"r8","[":"r8","*":"r8","+":"r8","|":"r8","$":"r8","ch":"r8"},{"exp_unit":"s14","exp":"s15","[":"s16","ch":"s17","(":"s18"},{"exp_unit":"s2","exp":"s6","(":"r2","[":"r2","|":"s7","$":"r2","ch":"s4"},{"exp_unit":"s2","exp":"s19","[":"s3","ch":"s4","(":"s5"},{"(":"r4","[":"r4","|":"r4","$":"r4","ch":"r4"},{"(":"r5","[":"r5","|":"r5","$":"r5","ch":"r5"},{"]":"s20","union_unit":"s21","ch":"s13"},{"union_units":"s22","union_unit":"s12","ch":"s13"},{"]":"r11","ch":"r11"},{"]":"r12","ch":"r12","-":"s23"},{"(":"r1",")":"r1","[":"r1","|":"r1","ch":"r1","+":"s24","*":"s25"},{"exp_unit":"s14","exp":"s26","|":"s27","[":"s16","ch":"s17","(":"s18",")":"s28"},{"union_units":"s29","^":"s30","union_unit":"s12","ch":"s13"},{"(":"r8",")":"r8","[":"r8","*":"r8","+":"r8","|":"r8","ch":"r8"},{"exp_unit":"s14","exp":"s31","[":"s16","ch":"s17","(":"s18"},{"exp_unit":"s2","exp":"s6","|":"r3","(":"r3","[":"r3","$":"r3","ch":"s4"},{"(":"r6","[":"r6","*":"r6","+":"r6","|":"r6","$":"r6","ch":"r6"},{"]":"r10","ch":"r10"},{"]":"s32","union_unit":"s21","ch":"s13"},{"ch":"s33"},{"(":"r4",")":"r4","[":"r4","|":"r4","ch":"r4"},{"(":"r5",")":"r5","[":"r5","|":"r5","ch":"r5"},{"exp_unit":"s14","exp":"s26","(":"r2",")":"r2","[":"r2","|":"s27","ch":"s17"},{"exp_unit":"s14","exp":"s34","[":"s16","ch":"s17","(":"s18"},{"(":"r9","[":"r9","*":"r9","+":"r9","|":"r9","$":"r9","ch":"r9"},{"]":"s35","union_unit":"s21","ch":"s13"},{"union_units":"s36","union_unit":"s12","ch":"s13"},{"exp_unit":"s14","exp":"s26","|":"s27","[":"s16","ch":"s17","(":"s18",")":"s37"},{"(":"r7","[":"r7","*":"r7","+":"r7","|":"r7","$":"r7","ch":"r7"},{"]":"r13","ch":"r13"},{"exp_unit":"s14","exp":"s26","|":"r3","(":"r3",")":"r3","[":"r3","ch":"s17"},{"(":"r6",")":"r6","[":"r6","*":"r6","+":"r6","|":"r6","ch":"r6"},{"]":"s38","union_unit":"s21","ch":"s13"},{"(":"r9",")":"r9","[":"r9","*":"r9","+":"r9","|":"r9","ch":"r9"},{"(":"r7",")":"r7","[":"r7","*":"r7","+":"r7","|":"r7","ch":"r7"}]`);
    let syntaxHead: string[] = [`exp'`,`exp`,`exp`,`exp`,`exp`,`exp`,`exp_unit`,`exp_unit`,`exp_unit`,`exp_unit`,`union_units`,`union_units`,`union_unit`,`union_unit`];//每个产生式的头部,规约的时候使用
    let syntaxLength = [1,1,2,3,2,2,3,4,1,3,2,1,1,3];
    let functionArray:(((args:any[],stack:any[])=>any)|undefined)[]=[
        function ($) {
            return $[0];
        },function ($) {
                        return $[0];
                    },function ($) {
                        let ret = $[0];
                        ret.concatenate($[1]);
                        return ret;
                    },function ($) {
                        let ret = $[0];
                        ret.union($[2]);
                        return ret;
                    },function ($) {
                        let ret = $[0].clone();
                        $[0].kleeneClosure();
                        ret.concatenate($[0]);
                        return ret;
                    },function ($) {
                        let ret = $[0];
                        ret.kleeneClosure();
                        return ret;
                    },function ($) {
                        let edges = $[1];
                        assert(edges.length > 0, '[]里面必须有至少一个字符');
                        let ret = undefined;
                        for (let edge of edges) {
                            if (ret == undefined) {
                                ret = new NFAAutomaton({ ch: [edge.start, edge.end] });
                            }
                            else {
                                edge.target = [ret.end];
                                ret.start.addEdge(edge);
                            }
                        }
                        assert(ret != undefined);
                        return ret;
                    },function ($) {
                        let edges = $[2];
                        assert(edges.length > 0, '^后面必须有至少一个字符');
                        let ret = undefined;
                        for (let edge of edges) {
                            for (let tmp of edge.not()) {
                                if (ret == undefined) {
                                    ret = new NFAAutomaton({ ch: [tmp.start, tmp.end] });
                                }
                                else {
                                    tmp.target = [ret.end];
                                    ret.start.addEdge(tmp);
                                }
                            }
                        }
                        assert(ret != undefined);
                        return ret;
                    },function ($) {
                        if ($[0] == -1) {
                            return new NFAAutomaton({ ch: [0, 0xffff] });
                        }
                        else {
                            return new NFAAutomaton({ ch: [$[0], $[0]] });
                        }
                    },function ($) {
                        return $[1];
                    },function ($) {
                        return [...$[0], $[1]];
                    },function ($) {
                        return [$[0]];
                    },function ($) {
                        let code;
                        if ($[0] == -1) {
                            code = '.'.charCodeAt(0);
                        }
                        else {
                            code = $[0];
                        }
                        return new AutomatonEdge(code, code, []);
                    },function ($) {
                        let code1;
                        let code2;
                        if ($[0] == -1) {
                            code1 = '.'.charCodeAt(0);
                        }
                        else {
                            code1 = $[0];
                        }
                        if ($[2] == -1) {
                            code2 = '.'.charCodeAt(0);
                        }
                        else {
                            code2 = $[2];
                        }
                        return new AutomatonEdge(code1, code2, []);
                    }];
    let result;//最终规约之后的返回值,由accept动作提供
    let yytoken:YYTOKEN | undefined;
    let errorRollback = false;//是否处于错误恢复模式
    let hasError=false;//是否曾经出现过错误
    //如龙书所说:"S0(即分析器的开始状态)不代表任何文法符号，它只是作为栈底标记，同时也在语法分析过程中担负了重要的角色。"
    //自己标注的:用于规约成增广文法初始符号S'
    let symbolStack: Token[] = [{ type: syntaxHead[0], value: undefined }];//符号栈
    let symbolValStack: any[] = [undefined];//符号值栈，是symbolStack的value构成的栈，用于插入动作
    let stateStack: number[] = [0];//状态栈
    let reduceToken: Token | null = null;
    let lexBuffer: Token | null = null;//lex输入缓冲,如果遇到规约,则上次从lex读取到的数据还没有被使用
    L0:
    for (; ;) {
        let nowState = stateStack[stateStack.length - 1];
        let sym: Token;
        /**
         * 如果没有规约出来的符号,则使用lex读取输入,因为不可能出现连写的规约,所以用一个变量reduceToken保存规约而 成的符号就够了
         * 对于LR(1)分析器来说,规约要求输入符号必须是一个终结符,而规约必定是得到一个非终结符,所以不可能出现不读取输入而连续多次规约的情况
         */
        if (reduceToken == null) {
            if (lexBuffer == null) {
                yytoken = lexer.yylex();
                lexBuffer = yytoken;
            }
            sym = lexBuffer;
            lexBuffer = null;
        } else {
            sym = reduceToken;
            reduceToken = null;
        }
        let actionString = state[nowState][sym.type];
        if (actionString != undefined&&actionString != 'err') {
            if (sym.type != `error`) {//不是因为error符号产生的移入则解除错误回滚标志
                errorRollback = false;
            }
            let action = actionString.substring(0, 1);
            let target = Number(actionString.substring(1, actionString.length));
            if (action == "s") {//移入
                symbolStack.push(sym);
                symbolValStack.push(sym.value);//保持和stateStack一致
                stateStack.push(target);
            } else {//规约
                let args: any[] = [];
                for (let i = 0; i < syntaxLength[target]; i++) {
                    args.unshift(symbolStack.pop()!.value);
                    symbolValStack.pop();//保持和stateStack一致
                    stateStack.pop();
                }
                reduceToken = {
                    type: syntaxHead[target],
                    value: undefined//规约动作的返回值
                };
                if(functionArray[target]!=undefined){
                    reduceToken.value=functionArray[target]!(args,symbolValStack);//调用规约动作
                }
                if (target == 0) {
                    result=reduceToken.value;//增广文法的返回值
                    break;//文法分析结束
                }
                lexBuffer = sym;//把读取到的符号暂时退回去
            }
        } else {
            hasError=true;
            if (errorRollback) { //已经在错误处理状态中了
                //什么都不用做,消耗lex中的token就行了
                if (sym.type == `$`) {//因为EOF导致的错误,不需要回溯了
                    break;
                }
            }
            else {//如果不处于错误恢复状态,则进行一些操作
                lexer.yyerror(`语法错误:此处不能接受${sym.type}`);
                if (sym.type == `$`) {//因为EOF导致的错误,不需要回溯了
                    break;
                }
                errorRollback = true;
                //状态栈中默认包含一个状态0,如果回溯到这个位置还不能移入error,则放弃回溯
                for (; stateStack.length > 0;) {//尝试回退栈中状态,直到状态包含一个形如 A->.error any,any的项,简单来说就是这个状态可以接收error
                    if (state[stateStack[stateStack.length-1]][`error`] != undefined) {
                        reduceToken = {
                            type: `error`,
                            value: undefined
                        };
                        lexBuffer = sym;//把读取到的符号暂时退回去
                        continue L0;//假装已经把所有的错误符号规约成了error,进行下一轮操作
                    } else {
                        stateStack.pop();
                        symbolValStack.pop();//保持和stateStack一致
                        symbolStack.pop();
                    }
                }
                break;//弹出栈中的所有符号都不能处理错误,结束语法分析,在函数末尾抛出异常
            }
        }
    }
    if(hasError){
        throw new ParseException(`源码不符合文法`);
    }else{
        return result;
    }
}
