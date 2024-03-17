import { Message } from "./Message";

export abstract class Rag {
  abstract rewrite(
    questionMessage: Message,
    messages?: Message[]
  ): Promise<void>;
}
