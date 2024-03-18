import { ChatAL } from "./ChatAL";

export abstract class Rag {
  abstract rewrite(
    questionMessage: ChatAL.Message,
    messages?: ChatAL.Message[]
  ): Promise<void>;
}
