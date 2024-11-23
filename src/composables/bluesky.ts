import { createSharedComposable } from '@vueuse/core'
import { AtpAgent } from '@atproto/api'
import type { ProfileView } from '@atproto/api/dist/client/types/app/bsky/actor/defs'
import { until } from '@vueuse/core'
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { ProcessedState, RankedResult, useBskyStore } from '@/stores/bskyStore'

function bskyCrawling() {
  const { follows, userPosts, progress, identifier, password, rawUserCounts } = storeToRefs(
    useBskyStore(),
  )
  const pause = ref(false)

  const agent = new AtpAgent({ service: 'https://public.api.bsky.app' })

  // TODO: Proper authentication
  agent.login({
    identifier: identifier.value,
    password: password.value,
  })

  async function getProfile(actor: string) {
    const { data, success } = await agent.getProfile({
      actor,
    })
    if (!success) throw new Error(`Failed to load profile for ${actor}`)

    return data
  }

  async function getAllFollows(actor: string) {
    const follows: ProfileView[] = []
    let cursor: string | undefined = undefined
    do {
      const { data, success } = await agent.getFollows({ actor, cursor })
      if (!success) throw new Error(`Failed to load follows for ${actor} `)
      follows.push(...data.follows)
      cursor = data.cursor
    } while (cursor !== undefined)

    return follows
  }

  async function getRecentImagePosts(actor: string) {
    if (actor in userPosts.value) return userPosts.value[actor]

    const { data, success } = await agent.getAuthorFeed({
      actor,
      filter: 'posts_with_media',
      limit: 10,
    })
    if (!success) throw new Error(`Failed to load posts for ${actor}`)

    userPosts.value[actor] = data.feed
    return data.feed
  }

  async function crawlFollows(user: string) {
    follows.value = (await getAllFollows(user)).map((f) => ({
      ...f,
      state: ProcessedState.NotStarted,
    }))

    for (const myFollow of follows.value) {
      // Enabling pausing
      await until(pause).not.toBeTruthy()
      console.log(`[${myFollow.handle}] starting`)
      myFollow.state = ProcessedState.Processing
      try {
        const followings = await getAllFollows(myFollow.did)

        console.log(`[${myFollow.handle}] found ${followings.length} followers`)

        // Exclude users already being followed
        const filtered = followings.filter((f) => !follows.value.some((mf) => mf.did === f.did))
        console.log(`[${myFollow.handle}] found ${filtered.length} filtered followers`)

        const start = Date.now()
        rawUserCounts.value.push(...filtered.map((f) => f.did))
        console.log(`took ${Date.now() - start}ms`)

        myFollow.state = ProcessedState.Complete
        console.log(`[${myFollow.handle}] done`)
      } catch (err) {
        console.error(`Failed to crawl ${myFollow.handle}`, err)
        myFollow.state = ProcessedState.Failed
      }
    }
  }

  const userCounts = computed<{ [did: string]: number }>(() => {
    // Sum up all the follow numbers
    return rawUserCounts.value.reduce((acc, curr) => {
      acc[curr] = (acc[curr] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  })

  const ranked = computed<RankedResult[]>(() =>
    Object.entries(userCounts.value)
      .sort(([_a, a], [_b, b]) => b - a)
      .map(([did, follows], ix) => ({
        did,
        rank: ix + 1,
        follows,
      })),
  )

  return {
    follows,
    progress,
    ranked,
    pause,
    crawlFollows,
    getRecentImagePosts,
    getProfile,
    identifier,
    userCounts,
  }
}

export const useBskyCrawling = createSharedComposable(bskyCrawling)
