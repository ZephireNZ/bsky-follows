import { createSharedComposable } from '@vueuse/core'
import { AtpAgent } from '@atproto/api'
import type { ProfileView } from '@atproto/api/dist/client/types/app/bsky/actor/defs'
import { until } from '@vueuse/core'
import { effectScope, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { ProcessedState, useBskyStore } from '@/stores/bskyStore'

function bskyCrawling() {
  const { follows, processedUsers, userPosts, progress, ranked, identifier, password, userCounts } =
    storeToRefs(useBskyStore())
  const pause = ref(false)

  const agent = new AtpAgent({ service: 'https://bsky.social' })

  // TODO: Proper authentication
  agent.login({
    identifier: identifier.value,
    password: password.value,
  })

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

        const scope = effectScope()

        scope.run(() => {
          for (const follow of filtered) {
            // Update the counts
            userCounts.value[follow.did] = (userCounts.value[follow.did] || 0) + 1

            if (!(follow.did in processedUsers.value)) {
              processedUsers.value[follow.did] = {
                did: follow.did,
                displayName: follow.displayName,
                handle: follow.handle,
                avatar: follow.avatar,
                description: follow.description,
              }
            }
          }
        })

        scope.stop()

        myFollow.state = ProcessedState.Complete
        console.log(`[${myFollow.handle}] done`)
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
    identifier,
    userCounts,
  }
}

export const useBskyCrawling = createSharedComposable(bskyCrawling)
