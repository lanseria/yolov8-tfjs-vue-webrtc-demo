<script setup lang="ts">
import * as tf from '@tensorflow/tfjs'

import '@tensorflow/tfjs-backend-webgl'

// set backend to webgl
const loading = ref(true)
const progress = ref(0)
const spinTip = computed(() => {
  return `Loading model... ${(progress.value * 100).toFixed(2)}%`
})
onMounted(() => {
  tf.ready().then(async () => {
    const yolov8 = await tf.loadGraphModel(
        `${window.location.href}/${modelName}_web_model/model.json`,
        {
          onProgress: (fractions) => {
            loading.value = true
            progress.value = fractions
          },
        },
    ) // load model

    // warming up model
    if (yolov8.inputs[0].shape) {
      const dummyInput = tf.ones(yolov8.inputs[0].shape)
      const warmupResults = yolov8.execute(dummyInput)
      loading.value = false
      progress.value = 1
      model.net = yolov8
      inputShape.value = yolov8.inputs[0].shape
      tf.dispose([warmupResults, dummyInput]) // cleanup memory
    }
  })
})
</script>

<template>
  <div>
    <a-typography :style="{ marginTop: '-40px' }">
      <a-typography-title>
        yolov8-tfjs-vue-webrtc-demo
      </a-typography-title>
      <ASpin :loading="loading" class="w-960px mx-auto" :tip="spinTip">
        <a-tabs default-active-key="1" destroy-on-hide lazy-load>
          <a-tab-pane key="1" title="WebRTC">
            <TabsWebRTC />
          </a-tab-pane>
          <a-tab-pane key="2" title="Video">
            <TabsVideo />
          </a-tab-pane>
          <a-tab-pane key="3" title="Picture">
            <TabsPicture />
          </a-tab-pane>
        </a-tabs>
      </ASpin>
    </a-typography>
  </div>
</template>
