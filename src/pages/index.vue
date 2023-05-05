<script setup lang="ts">
const value = ref('')
</script>

<template>
  <div>
    <a-typography :style="{ marginTop: '-40px' }">
      <a-typography-title>
        Arco Uno Basic Template
      </a-typography-title>
      <ParentSelect v-model="value" placeholder="请选择" />
      <a-space>
        <a-button type="primary">
          Primary
        </a-button>
        <a-button>Secondary</a-button>
        <a-button type="dashed">
          Dashed
        </a-button>
        <a-button type="outline">
          Outline
        </a-button>
        <a-button type="text">
          Text
        </a-button>
      </a-space>
    </a-typography>
  </div>
</template>
