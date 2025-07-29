<script setup lang="ts"></script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<style>
body {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
.notion {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.notion-page-cover {
  max-width: 1000px;
  box-sizing: border-box;
  border-radius: 25px;
}

@media screen and (max-width: 600px) {
  body {
    padding: 0;
  }
}
</style>
