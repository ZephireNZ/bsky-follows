import { defineStore } from 'pinia'
import type { ProfileView } from '@atproto/api/dist/client/types/app/bsky/actor/defs'
import type { FeedViewPost } from '@atproto/api/dist/client/types/app/bsky/feed/defs'
import { computed, ref } from 'vue'

export enum ProcessedState {
  NotStarted,
  Processing,
  Complete,
  Failed,
}

export type Follow = ProfileView & {
  state: ProcessedState
}

export type Result = {
  profile: ProfileView
  follows: number
}

export type RankedResult = Result & {
  rank: number
}

export const useBskyStore = defineStore('bsky', () => {
  const userPosts = ref<{ [did: string]: FeedViewPost[] }>({})

  const follows = ref<Follow[]>([])

  const processedUsers = ref<{ [did: string]: Result }>({})

  const ranked = computed<RankedResult[]>(() =>
    Object.values(processedUsers.value)
      .sort((a, b) => b.follows - a.follows)
      .map((result, ix) => ({
        rank: ix + 1,
        ...result,
      })),
  )

  const progress = computed(() => {
    return follows.value.reduce((rv, follow) => {
      rv[follow.state] = (rv[follow.state] || 0) + 1
      return rv
    }, {} as Record<ProcessedState, number>)
  })

  return {
    follows,
    progress,
    processedUsers,
    userPosts,
    ranked,
  }
})
