<script lang="ts" setup>
const isPlay = ref(false)
const canvasRef = ref()
const form = ref({
  suuid: '重油泵棚东',
})
function handlePlay() {
  isPlay.value = !isPlay.value
}
function onVideoPlayDetect(videoRef: Ref<HTMLVideoElement>) {
  //
  detectVideo(videoRef.value, canvasRef.value)
}
watch(() => globalActiveKey.value, () => {
  unDetectVideo()
})
</script>

<template>
  <div>
    <a-form :model="form" layout="inline">
      <a-form-item field="SOURCE_NAME" label="SOURCE_NAME">
        <a-input v-model="form.suuid" placeholder="please enter your go2rtc url WebRTC SOURCE NAME" class="w-650px" />
      </a-form-item>
      <a-form-item>
        <a-button @click="handlePlay()">
          Play / Pause
        </a-button>
      </a-form-item>
    </a-form>
    <div v-if="isPlay" class="relative h-full w-full">
      <VideoRtc :suuid="form.suuid" @play="onVideoPlayDetect" />
      <canvas ref="canvasRef" class="absolute top-0 w-full h-full" :width="inputShape[1]" :height="inputShape[2]" />
    </div>
  </div>
</template>
