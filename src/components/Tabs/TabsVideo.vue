<script lang="ts" setup>
import { useFileSystemAccess } from '@vueuse/core'

const dataType = ref('Blob') as Ref<'Text' | 'ArrayBuffer' | 'Blob'>
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
const videoUrl = ref('')
watch(() => file.value, () => {
  if (file.value) {
    videoUrl.value = URL.createObjectURL(file.value)
    console.log(videoUrl.value)
  }
})
onMounted(() => {
  if (!isSupported.value)
    alert('该浏览器不支持 File System Access API !')
})
</script>

<template>
  <div class="flex flex-col justify-start">
    <ASpace class="mb-10px">
      <AButton @click="open()">
        选择本地文件
      </AButton>
    </ASpace>
    <video class="h-full w-full" :src="videoUrl" controls />
  </div>
</template>
