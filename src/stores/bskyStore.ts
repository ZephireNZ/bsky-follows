import { defineStore } from 'pinia'
import type { ProfileView } from '@atproto/api/dist/client/types/app/bsky/actor/defs'
import type { FeedViewPost } from '@atproto/api/dist/client/types/app/bsky/feed/defs'
import { computed, ref } from 'vue'
import auth from '@/../auth.json'

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
}

export const useBskyStore = defineStore('bsky', () => {
  const identifier = ref(auth.identifier)
  const password = ref(auth.password)

  const userPosts = ref<{ [did: string]: FeedViewPost[] }>({})

  const follows = ref<Follow[]>([])

  const userCounts = ref<{ [did: string]: number }>({})

  const processedUsers = ref<{ [did: string]: ProfileView }>({})

  const ranked = computed<RankedResult[]>(() =>
    Object.entries(userCounts.value)
      .sort(([_a, a], [_b, b]) => b - a)
      .map(([did], ix) => ({
        did,
        rank: ix + 1,
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
    identifier,
    password,
    userCounts,
  }
})
