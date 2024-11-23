<script lang="ts" setup>
import { useBskyCrawling } from '@/composables/bluesky'
import { ProcessedState } from '@/stores/bskyStore'
import {
  Panel,
  IconField,
  InputIcon,
  InputText,
  FloatLabel,
  Button,
  Divider,
  MeterGroup,
  MeterItem,
} from 'primevue'
import { computed, ref } from 'vue'

const { crawlFollows, pause, follows, progress, identifier } = useBskyCrawling()

const started = ref(false)
const username = ref(identifier)

const totalFollows = computed(() => follows.value.length)

const meterItems = computed<MeterItem[]>(() => {
  return [
    {
      label: 'Complete',
      value: progress.value[ProcessedState.Complete],
      color: '#22c55e',
    },
    {
      label: 'Processing',
      value: progress.value[ProcessedState.Processing],
      color: '#eab308',
    },
    {
      label: 'Failed',
      value: progress.value[ProcessedState.Failed],
      color: '#ef4444',
    },
  ]
})

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
      <Divider />
      <MeterGroup v-if="started" :value="meterItems" :max="totalFollows" />
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

:deep(.p-metergroup-label-list) {
  display: none;
}
</style>
