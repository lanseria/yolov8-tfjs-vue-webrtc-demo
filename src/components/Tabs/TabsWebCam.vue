<script lang="ts" setup>
const canvasRef = ref()
const videoRef = ref<HTMLVideoElement>()
const currentCamera = ref<string>()
const { videoInputs: cameras } = useDevicesList({
  requestPermissions: true,
  onUpdated() {
    if (!cameras.value.find(i => i.deviceId === currentCamera.value))
      currentCamera.value = cameras.value[0]?.deviceId
  },
})

const { stream, enabled } = useUserMedia({
  constraints: { video: { deviceId: currentCamera.value } },
})
watchEffect(() => {
  if (videoRef.value)
    videoRef.value.srcObject = stream.value!
})
function onVideoPlayDetect() {
  //
  detectVideo(videoRef.value!, canvasRef.value)
}
</script>

<template>
  <div class="flex flex-col justify-start">
    <ASpace class="mb-10px">
      <AButton @click="enabled = !enabled">
        {{ enabled ? 'Stop' : 'Start' }}
      </AButton>
    </ASpace>
    <div>
      <div
        v-for="camera of cameras"
        :key="camera.deviceId"
        class="px-2 py-1 cursor-pointer"
        :class="{ 'text-primary': currentCamera === camera.deviceId }"
        @click="currentCamera = camera.deviceId"
      >
        {{ camera.label }}
      </div>
    </div>
    <div v-show="enabled" class="relative h-full w-full">
      <video ref="videoRef" class="h-full w-full" controls autoplay @play="onVideoPlayDetect" />
      <canvas ref="canvasRef" class="absolute top-0 w-full h-full pointer-events-none" :width="inputShape[1]" :height="inputShape[2]" />
    </div>
  </div>
</template>
