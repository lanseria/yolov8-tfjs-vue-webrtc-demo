<script setup lang="ts">
import { globalActiveKey } from '~/composables'

onMounted(() => {
  loadTfModels()
})
</script>

<template>
  <div>
    <a-typography :style="{ marginTop: '-40px' }">
      <a-typography-title>
        yolov8-tfjs-vue-webrtc-demo
      </a-typography-title>
      <ASpin :loading="tfjsLoading" class="w-960px mx-auto" :tip="tfjsSpinTip">
        <a-tabs v-model:active-key="globalActiveKey" lazy-load>
          <a-tab-pane key="1" title="WebRTC">
            <TabsWebRTC />
          </a-tab-pane>
          <a-tab-pane key="2" title="Video">
            <TabsVideo />
          </a-tab-pane>
          <a-tab-pane key="3" title="Picture">
            <TabsPicture />
          </a-tab-pane>
          <a-tab-pane key="4" title="WebCam">
            <TabsWebCam />
          </a-tab-pane>
        </a-tabs>
      </ASpin>
    </a-typography>
  </div>
</template>
