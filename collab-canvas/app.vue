<template>
  <UApp :notifications="false">
    <NuxtPage />
  </UApp>
</template>

<script setup lang="ts">
// Global app configuration
useHead({
  titleTemplate: '%s - CollabCanvas',
  meta: [
    { charset: 'utf-8' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ]
})
</script>
