import { defineStore } from 'pinia'
import type { ProfileView } from '@atproto/api/dist/client/types/app/bsky/actor/defs'
import type { FeedViewPost } from '@atproto/api/dist/client/types/app/bsky/feed/defs'
import { computed, reactive, ref } from 'vue'

export enum ProcessedState {
  NotStarted,
  Processing,
  Complete,
  Failed,
}

export type Follow = ProfileView & {
  state: ProcessedState
}

export type Result = ProfileView & {
  follows: number
}

export type RankedResult = {
  did: string
  rank: number
  follows: number
}

export const useBskyStore = defineStore('bsky', () => {
  const identifier = ref()
  const userPosts = ref<{ [did: string]: FeedViewPost[] }>({})

  const follows = ref<Follow[]>([])

  const rawUserCounts = reactive<string[]>([])

  const progress = computed(() => {
    return follows.value.reduce((rv, follow) => {
      rv[follow.state] = (rv[follow.state] || 0) + 1
      return rv
    }, {} as Record<ProcessedState, number>)
  })

  return {
    follows,
    progress,
    userPosts,
    identifier,
    rawUserCounts,
  }
})
