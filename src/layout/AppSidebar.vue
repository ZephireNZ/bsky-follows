<script lang="ts" setup>
import { useBskyCrawling } from '@/composables/bluesky'
import { Panel, IconField, InputIcon, InputText, FloatLabel, Button } from 'primevue'
import { ref } from 'vue'

const { crawlFollows, pause } = useBskyCrawling()

const started = ref(false)
const username = ref('')

async function onClick() {
  if (started.value) {
    pause.value = !pause.value
  } else {
    started.value = true
    await crawlFollows(username.value)
  }
}
</script>

<template>
  <div class="layout-sidebar">
    <Panel class="min-h-full">
      <div class="flex flex-col gap-2">
        <FloatLabel variant="in">
          <IconField>
            <InputIcon class="pi pi-search" />
            <InputText v-model="username" type="text" />
          </IconField>
          <label for="username">Bluesky Username</label>
        </FloatLabel>
        <Button @click="onClick">{{ started ? (pause ? 'Resume' : 'Pause') : 'Start' }}</Button>
      </div>
    </Panel>
  </div>
</template>

<style lang="scss" scoped>
.layout-sidebar {
  position: fixed;
  width: 20rem;
  height: calc(100vh - 8rem);
  z-index: 999;
  overflow-y: auto;
  user-select: none;
  top: 6rem;
  left: 2rem;
  transition: transform var(--layout-section-transition-duration),
    left var(--layout-section-transition-duration);
  background-color: var(--surface-overlay);
  border-radius: var(--content-border-radius);
  padding: 0.5rem 1.5rem;
}
</style>
