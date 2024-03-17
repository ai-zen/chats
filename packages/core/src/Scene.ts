import { ChatContext } from "./ChatContext.js";
import { PickRequired } from "./Common.js";

export class Scene extends ChatContext {
  constructor(options: PickRequired<Scene, "model_key">) {
    super(options);
  }
}
