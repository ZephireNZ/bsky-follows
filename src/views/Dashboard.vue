<script lang="ts" setup>
import { computed, ref } from 'vue'
import { useBskyCrawling } from '@/composables/bluesky'
import { Button } from 'primevue'
import BskyProfile from '../components/BskyProfile.vue'

const { ranked } = useBskyCrawling()

const limit = ref(20)

const shown = computed(() => ranked.value.filter((f) => f.rank <= limit.value))
</script>

<template>
  <main class="mt-12">
    <div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <ul
        role="list"
        class="divide-y divide-gray-100 grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch"
      >
        <li v-for="{ did, rank, follows } of shown" :key="did">
          <Suspense>
            <BskyProfile :did="did" :rank="rank" :follows="follows" />
          </Suspense>
        </li>
      </ul>
      <div>
        <Button v-if="shown.length > 0" class="mt-4 w-full" @click="() => (limit += 20)">
          Load More
        </Button>
      </div>
    </div>
  </main>
</template>
