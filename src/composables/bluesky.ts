import { createSharedComposable } from '@vueuse/core'
import { AtpAgent } from '@atproto/api'
import type { ProfileView } from '@atproto/api/dist/client/types/app/bsky/actor/defs'
import { until } from '@vueuse/core'
import { ref } from 'vue'
import { identifier, password } from '@/../auth.json'
import { storeToRefs } from 'pinia'
import { ProcessedState, useBskyStore } from '@/stores/bskyStore'

const agent = new AtpAgent({ service: 'https://bsky.social' })

// TODO: Proper authentication
await agent.login({
  identifier,
  password,
})

export async function getAllFollows(actor: string) {
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

export const nzGuys = await agent.app.bsky.graph.getList({
  list: 'at://did:plc:mkdkke6se63a7shistfli75i/app.bsky.graph.list/3lalelcz43s2b',
})

function bskyCrawling() {
  const { follows, processedUsers, userPosts, progress, ranked } = storeToRefs(useBskyStore())
  const pause = ref(false)

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

  async function crawlFollows(user?: string) {
    follows.value = (await getAllFollows(user ?? identifier)).map((f) => ({
      ...f,
      state: ProcessedState.NotStarted,
    }))

    for (const myFollow of follows.value) {
      // Enabling pausing
      await until(pause).not.toBeTruthy()
      myFollow.state = ProcessedState.Processing
      try {
        const followings = await getAllFollows(myFollow.did)
        const filtered = followings.filter((f) => !follows.value.some((mf) => mf.did === f.did))
        console.log(`[${myFollow.handle}] found ${filtered.length} filtered followers`)

        for (const follow of filtered) {
          if (!(follow.did in processedUsers)) {
            processedUsers.value[follow.did] = {
              profile: follow,
              follows: 1,
            }
          } else {
            processedUsers.value[follow.did].follows += 1
          }
        }
        myFollow.state = ProcessedState.Complete
      } catch (err) {
        console.error(`Failed to crawl ${myFollow.handle}`, err)
        myFollow.state = ProcessedState.Failed
      }
    }
  }

  return {
    follows,
    processedUsers,
    progress,
    ranked,
    pause,
    crawlFollows,
    getRecentImagePosts,
  }
}

export const useBskyCrawling = createSharedComposable(bskyCrawling)
