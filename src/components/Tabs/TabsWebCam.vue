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
  constraints: { video: { deviceId: currentCamera } },
})
watchEffect(() => {
  if (videoRef.value)
    videoRef.value.srcObject = stream.value!
})
watch(() => globalActiveKey.value, () => {
  videoRef.value?.pause()
})
function onVideoPlayDetect() {
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
        class="cursor-pointer px-2 py-1"
        :class="{ 'text-blue-6': currentCamera === camera.deviceId }"
        @click="currentCamera = camera.deviceId"
      >
        {{ camera.label }}
      </div>
    </div>
    <div v-show="enabled" class="relative h-full w-full">
      <video ref="videoRef" class="h-full w-full" controls autoplay @play="onVideoPlayDetect" />
      <canvas ref="canvasRef" class="pointer-events-none absolute top-0 h-full w-full" :width="inputShape[1]" :height="inputShape[2]" />
    </div>
  </div>
</template>
