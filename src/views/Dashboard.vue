<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { useBskyCrawling } from '@/composables/bluesky'
import BskyProfile from '../components/BskyProfile.vue'
import { Slider, ToggleSwitch, Button } from 'primevue'

const { crawlFollows, pause, ranked } = useBskyCrawling()

const minFollows = ref(3)

onMounted(async () => {
  // await crawlFollows()
})
</script>

<template>
  <main class="mt-12">
    <div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <Button @click="crawlFollows">Start</Button>
      <Slider :step="1" :min="1" :max="20" v-model="minFollows" />
      <p>Follows Shown: {{ minFollows }}</p>

      <div><ToggleSwitch v-model="pause" /> Pause</div>

      <ul role="list" class="divide-y divide-gray-100">
        <li
          v-for="follow of ranked"
          :key="follow.profile.did"
          class="flex justify-between gap-x-6 py-5"
        >
          <BskyProfile :profile="follow.profile" :rank="follow.rank" :follows="follow.follows" />
        </li>
      </ul>
    </div>
  </main>
</template>
