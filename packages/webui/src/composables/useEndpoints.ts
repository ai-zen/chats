import { Endpoints, ModelsKeys } from "@ai-zen/chats-core";
import { computed, reactive } from "vue";
import * as api from "../api";
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
      endpoint.enabled_models_keys.forEach((modelKey) => {
        map[modelKey] ??= [];
        map[modelKey]?.push(endpoint);
      });
    });

    console.log("endpoints model key map", map);

    return map;
  });

  function matchEndpointInstance(model_key: ModelsKeys) {
    const x = endpointState.list.find((x) =>
      x.enabled_models_keys.includes(model_key)
    );

    if (!x) throw new Error(`Endpoint already exists for model ${model_key}`);

    return new Endpoints[x.endpoint_key]({
      enabled_models_keys: x.enabled_models_keys,
      ...x.endpoint_config,
    });
  }

  return {
    endpointState,
    endpointsModelKeyMap,
    initEndpointState,
    matchEndpointInstance,
  };
}
