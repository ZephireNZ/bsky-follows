<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { useBskyCrawling } from '../atproto'
import BskyProfile from '../components/BskyProfile.vue'
import { Slider, ToggleSwitch } from 'primevue'

const { crawlFollows, crawls, pause } = useBskyCrawling()

const minFollows = ref(3)

const ranked = computed(() =>
  Object.values(crawls)
    .sort((a, b) => b.follows - a.follows)
    .filter((c) => c.follows >= minFollows.value),
)

onMounted(async () => {
  // await crawlFollows()
})
</script>

<template>
  <main class="mt-12">
    <div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <Slider :step="1" :min="1" :max="20" v-model="minFollows" />
      <p>Follows Shown: {{ minFollows }}</p>

      <div><ToggleSwitch v-model="pause" /> Pause</div>

      <ul role="list" class="divide-y divide-gray-100">
        <li
          v-for="(follow, idx) of ranked"
          :key="follow.profile.did"
          class="flex justify-between gap-x-6 py-5"
        >
          <BskyProfile :profile="follow.profile" :rank="idx" :follows="follow.follows" />
        </li>
      </ul>
    </div>
  </main>
</template>
