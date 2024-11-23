<script lang="ts" setup>
import { computed } from 'vue'
import { useBskyCrawling } from '@/composables/bluesky'
import BskyProfile from '../components/BskyProfile.vue'

const { ranked } = useBskyCrawling()

const shown = computed(() => ranked.value.filter((f) => f.rank <= 20))
</script>

<template>
  <main class="mt-12">
    <div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <ul role="list" class="divide-y divide-gray-100">
        <li v-for="{ did, rank } of shown" :key="did" class="flex justify-between gap-x-6 py-5">
          <BskyProfile :did="did" :rank="rank" />
        </li>
      </ul>
    </div>
  </main>
</template>
