import { createSharedComposable } from '@vueuse/core'
import { AtpAgent } from '@atproto/api'
import { until } from '@vueuse/core'
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { Follow, ProcessedState, RankedResult, useBskyStore } from '@/stores/bskyStore'

function bskyCrawling() {
  const { follows, userPosts, progress, identifier, rawUserCounts } = storeToRefs(useBskyStore())
  const pause = ref(false)

  const agent = new AtpAgent({ service: 'https://public.api.bsky.app' })

  async function getProfile(actor: string) {
    const { data, success } = await agent.getProfile({
      actor,
    })
    if (!success) throw new Error(`Failed to load profile for ${actor}`)

    return data
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

  async function* getAllFollowsGenerator(actor: string) {
    let cursor: string | undefined = undefined
    do {
      // Pause before continuing
      await until(pause).not.toBeTruthy()

      const { data, success } = await agent.getFollows({ actor, cursor })
      if (!success) throw new Error(`Failed to load follows for ${actor} `)
      yield data.follows
      cursor = data.cursor
    } while (cursor !== undefined)
  }

  async function crawlFollows(user: string) {
    const chunkSize = 10

    // Populate top-level list of followers to crawl
    follows.value = []
    for await (const myFollows of getAllFollowsGenerator(user)) {
      follows.value.push(...myFollows.map((f) => ({ ...f, state: ProcessedState.NotStarted })))
    }

    for (let idx = 0; idx < follows.value.length; idx += chunkSize) {
      const chunk = follows.value.slice(idx, idx + chunkSize)
      await Promise.all(chunk.map((f) => crawlUser(f)))
    }
  }

  async function crawlUser(myFollow: Follow) {
    console.log(`[${myFollow.handle}] starting`)
    const { followsCount } = await getProfile(myFollow.did)

    if ((followsCount ?? 0) > 1000) {
      console.warn(`Skipping ${myFollow.handle} due to ${followsCount} followers`)
      myFollow.state = ProcessedState.Failed
      return
    }

    myFollow.state = ProcessedState.Processing

    try {
      for await (const followings of getAllFollowsGenerator(myFollow.did)) {
        console.log(`[${myFollow.handle}] found ${followings.length} of ${followsCount} followers`)
        const filtered = followings.filter((f) => !follows.value.some((mf) => mf.did === f.did))
        console.log(`[${myFollow.handle}] found ${filtered.length} filtered followers`)

        const start = Date.now()
        rawUserCounts.value.push(...filtered.map((f) => f.did))
        console.log(`took ${Date.now() - start}ms`)
      }

      myFollow.state = ProcessedState.Complete
      console.log(`[${myFollow.handle}] done`)
    } catch (err) {
      console.error(`Failed to crawl ${myFollow.handle}`, err)
      myFollow.state = ProcessedState.Failed
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
