import { ChatAL } from "./ChatAL.js";
import { ChatContext } from "./ChatContext.js";
import { PickRequired } from "./Common.js";

export class Scene extends ChatContext implements ChatAL.Scene {
  constructor(options: PickRequired<Scene, "model_key">) {
    super(options);
  }
}
