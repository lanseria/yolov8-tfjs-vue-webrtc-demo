<script lang="ts" setup>
import { useFileSystemAccess } from '@vueuse/core'

const canvasRef = ref()
const videoRef = ref<HTMLVideoElement>()
const dataType = ref('Blob') as Ref<'Text' | 'ArrayBuffer' | 'Blob'>
const videoUrl = ref('')
const { isSupported, file, open } = useFileSystemAccess({
  dataType,
  types: [{
    description: 'Video files',
    accept: {
      'video/*': ['.mp4', '.webm', '.mkv', '.avi', '.mov'],
    },
  }],
  excludeAcceptAllOption: true,
})
watch(() => file.value, () => {
  if (file.value)
    videoUrl.value = URL.createObjectURL(file.value)
})
onMounted(() => {
  if (!isSupported.value)
    alert('该浏览器不支持 File System Access API !')
})

watch(() => globalActiveKey.value, () => {
  const url = videoUrl.value
  URL.revokeObjectURL(url)
  videoUrl.value = ''
  videoRef.value?.pause()
})
function onVideoPlayDetect() {
  //
  detectVideo(videoRef.value!, canvasRef.value)
}
</script>

<template>
  <div class="flex flex-col justify-start">
    <ASpace class="mb-10px">
      <AButton @click="open()">
        选择本地文件
      </AButton>
    </ASpace>

    <div class="relative h-full w-full">
      <video v-show="videoUrl" ref="videoRef" class="h-full w-full" :src="videoUrl" controls autoplay @play="onVideoPlayDetect" />
      <canvas ref="canvasRef" class="absolute top-0 w-full h-full pointer-events-none" :width="inputShape[1]" :height="inputShape[2]" />
    </div>
  </div>
</template>
