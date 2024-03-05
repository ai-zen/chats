import { ChatAL } from "./ChatAL.js";
import { PickRequired } from "./Common.js";

export class Tool implements ChatAL.Tool {
  type: "function";
  function: ChatAL.FunctionDefine;
  code?: string;
  callback?: (parsedArgs: any) => any;

  constructor(options: PickRequired<Tool, "function">) {
    if (!options.function) throw new Error("Tool must have a function");
    this.type = options.type ?? "function";
    this.function = options.function;
    this.code = options.code;
    this.callback = options.callback;
  }

  async exec(parsedArgs: any) {
    let result;

    // 如果工具定义了回调函数
    if (this.callback) {
      // 直接执行回调函数
      result = await this.callback(parsedArgs);
    }

    // 如果工具定义了代码
    if (this.code) {
      // 根据函数参数定义构造一个新的参数对象。
      // 确保参数对象中不会缺少任何键，如果缺少某些键可能会在后续执行过程中引起 `x is no defined` 错误。
      let intactArgs = Object.fromEntries(
        Object.keys(this.function.parameters.properties!).map((key) => [
          key,
          parsedArgs[key],
        ])
      );

      // 创建一个新函数并执行
      result = await new Function(...Object.keys(intactArgs), this.code)(
        ...Object.values(intactArgs)
      );
    }

    // 如果结果已经是字符串就直接返回，否则用JSON序列化一遍。
    if (typeof result == "string") {
      return result;
    } else {
      return JSON.stringify(result);
    }

    // 注意即使结果是 result 是 undefined，也属于合法的值，也需要序列化后返回
  }
}
