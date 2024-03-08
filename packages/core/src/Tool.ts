import { ChatAL } from "./ChatAL.js";
import { PickRequired } from "./Common.js";
import {
  ExecutableFunctionDefine,
  FunctionCallContext,
} from "./FunctionCallContext.js";

export class Tool implements ChatAL.Tool, ExecutableFunctionDefine {
  type: "function";
  function: ChatAL.FunctionDefine;
  code?: string;
  callback?: (parsed_args: any) => any;

  constructor(options: PickRequired<Tool, "function">) {
    if (!options.function) throw new Error("Tool must have a function");
    this.type = options.type ?? "function";
    this.function = options.function;
    this.code = options.code;
    this.callback = options.callback;
  }

  async exec(ctx: FunctionCallContext) {
    let result;

    // If the tool has a callback function
    if (this.callback) {
      // Execute the callback function
      result = await this.callback.call(ctx, ctx.parsed_args);
    }

    // If the tool has code
    if (this.code) {
      // Construct a new parameter object based on the function parameters definition
      // Make sure that the parameter object does not have any missing keys, as missing keys may cause "x is not defined" errors during execution
      const wideArgs = Object.fromEntries(
        Object.keys(this.function.parameters.properties!).map((key) => [
          key,
          ctx.parsed_args[key],
        ])
      );

      // Create a new function and execute it
      const fun = new Function(...Object.keys(wideArgs), this.code);
      result = await fun.call(ctx, ...Object.values(wideArgs));
    }

    // If the result is already a string, return it as is. Otherwise, serialize it using JSON.stringify().
    // Note that even if the result is undefined, it is a valid value and still needs to be serialized before returning
    if (typeof result !== "string") {
      result = JSON.stringify(result);
    }

    // Return the result
    return result;
  }
}
