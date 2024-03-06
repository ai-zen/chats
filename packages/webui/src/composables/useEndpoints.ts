import { computed, reactive } from "vue";
import * as api from "../api";
import { Models, ModelsKeys, ModelType } from "@ai-zen/chats-core";
import { ChatPL } from "../types/ChatPL";

export function useEndpoint() {
  const endpointState = reactive({
    list: [] as ChatPL.EndpointPO[],
    isLoading: false,
    isReady: false,
    isSaving: false,
  });

  async function getList() {
    try {
      endpointState.isLoading = true;
      endpointState.list = await api.getEndpointList();
      endpointState.isReady = true;
    } finally {
      endpointState.isLoading = false;
    }
  }

  async function initEndpointState() {
    await getList();
  }

  const endpointsModelKeyMap = computed(() => {
    const map = {} as Record<ModelsKeys, ChatPL.EndpointPO[]>;

    endpointState.list.forEach((endpoint) => {
      map[endpoint.model_key] ??= [];
      map[endpoint.model_key]?.push(endpoint);
    });

    console.log('map', map)

    return map;
  });

  const endpointsModelTypeMap = computed(() => {
    const map: Record<ModelType, ChatPL.EndpointPO[]> = {
      [ModelType.Completion]: [],
      [ModelType.ChatCompletion]: [],
      [ModelType.Embedding]: [],
    };

    endpointState.list.forEach((endpoint) => {
      const type = Models[endpoint.model_key]?.type;
      map[type]?.push(endpoint);
    });

    return map;
  });

  function isInvalidEndpoint(modelType: ModelType, endpointId?: string) {
    return (
      !endpointId ||
      !endpointsModelTypeMap.value?.[modelType].some((x) => x.id == endpointId)
    );
  }

  function getEndpoint(id?: string) {
    return endpointState.list.find((x) => x.id === id);
  }

  function getEndpoints(ids?: string[]): ChatPL.EndpointPO[] {
    return (
      (ids?.map(getEndpoint).filter((x) => x) as ChatPL.EndpointPO[]) ?? []
    );
  }

  return {
    endpointState,
    endpointsModelTypeMap,
    endpointsModelKeyMap,
    isInvalidEndpoint,
    initEndpointState,
    getEndpoint,
    getEndpoints,
  };
}
