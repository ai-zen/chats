import {
  Tool,
  CodeTool,
  CallbackTool,
  KnowledgeBase,
  ChatContext,
  Message,
  EmbeddingSearch,
  IndexedSearchTool,
  AgentTool,
  Scene,
} from "@ai-zen/chats-core";
import { Rag } from "@ai-zen/chats-core/dist/Rag";
import { ChatPL } from "../types/ChatPL";

export function useDeserialize(options: {
  getTools(ids: string[]): ChatPL.ToolPO[];
  getAgents(ids: string[]): ChatPL.AgentPO[];
  getKnowledgeBases(ids: string[]): ChatPL.KnowledgeBasePO[];
}) {
  function formatTool(toolPO: ChatPL.ToolPO): Tool {
    if (toolPO.code) {
      return new CodeTool(toolPO as Required<ChatPL.ToolPO>);
    } else if (toolPO.callback) {
      return new CallbackTool(toolPO as Required<ChatPL.ToolPO>);
    }
    throw new Error("Unknown tool type");
  }

  function formatKnowledgeBase(
    knowledgeBasePO: ChatPL.KnowledgeBasePO
  ): KnowledgeBase {
    return new KnowledgeBase(knowledgeBasePO);
  }

  function formatChatContext(chatContextPO: ChatPL.ChatContextPO): ChatContext {
    const messages = chatContextPO.messages.map((x) => new Message(x));

    const tools: Tool[] = [
      ...options.getTools(chatContextPO.tools_ids).map(formatTool),
      ...options.getAgents(chatContextPO.agents_ids).map(formatAgent),
    ];

    let rag: Rag | undefined = undefined;
    if (
      chatContextPO.retrieval_type == ChatPL.RetrievalType.RAG_EMBEDDING_SEARCH
    ) {
      rag = new EmbeddingSearch({
        knowledge_bases: options
          .getKnowledgeBases(chatContextPO.knowledge_bases_ids)
          .map(formatKnowledgeBase),
      });
    } else if (
      chatContextPO.retrieval_type == ChatPL.RetrievalType.TOOL_INDEXED_SEARCH
    ) {
      const entries = options
        .getKnowledgeBases(chatContextPO.knowledge_bases_ids)
        .map((x) => x.data)
        .flat();
      tools.push(new IndexedSearchTool({ entries }));
    }

    return new ChatContext({
      ...chatContextPO,
      messages,
      tools,
      rag,
    });
  }

  function formatAgent(agentPO: ChatPL.AgentPO): AgentTool {
    return new AgentTool({
      ...agentPO,
      ...formatChatContext(agentPO),
    });
  }

  function formatScene(scenePO: ChatPL.ScenePO): Scene {
    return new Scene(formatChatContext(scenePO));
  }

  return {
    formatTool,
    formatKnowledgeBase,
    formatChatContext,
    formatAgent,
    formatScene,
  };
}
