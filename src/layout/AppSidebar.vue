<script lang="ts" setup>
import { useBskyCrawling } from '@/composables/bluesky'
import { ProcessedState } from '@/stores/bskyStore'
import {
  IconField,
  InputIcon,
  InputText,
  FloatLabel,
  Button,
  Divider,
  MeterGroup,
  MeterItem,
  Avatar,
  VirtualScroller,
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
    <div class="flex flex-col bg-surface-900 text-surface-0 p-4 pb-0 rounded-lg h-full">
      <div class="flex flex-col gap-2">
        <FloatLabel variant="in">
          <IconField>
            <InputIcon class="pi pi-search" />
            <InputText v-model="username" class="w-full" type="text" />
          </IconField>
          <label for="username">Bluesky Username</label>
        </FloatLabel>
        <Button @click="onClick">{{ started ? (pause ? 'Resume' : 'Pause') : 'Start' }}</Button>
        <MeterGroup :value="meterItems" :max="totalFollows" />
      </div>
      <Divider />
      <VirtualScroller v-if="follows.length > 0" :items="follows" :item-size="64" class="shrink">
        <template #item="{ item: follow }">
          <div class="h-16 flex flex-row gap-1 items-center">
            <Avatar
              :key="follow.did"
              :image="follow.avatar"
              :icon="!follow.avatar ? 'pi pi-user' : undefined"
              :class="{
                'm-1': true,
                'ring-2': true,
                'ring-green-500': follow.state === ProcessedState.Complete,
                'ring-yellow-500': follow.state === ProcessedState.Processing,
                'ring-red-500': follow.state === ProcessedState.Failed,
              }"
              size="large"
              shape="circle"
            />
            <div class="overflow-x-clip">
              {{ follow.displayName !== '' ? follow.displayName : follow.handle }}
            </div>
          </div>
        </template>
      </VirtualScroller>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.layout-sidebar {
  position: fixed;
  width: 30rem;
  height: calc(100vh - 8rem);
  max-height: calc(100vh - 8rem);
  z-index: 999;
  // overflow-y: auto;
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
