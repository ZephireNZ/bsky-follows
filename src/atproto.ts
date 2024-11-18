import { AtpAgent } from '@atproto/api'
import type { ProfileView } from '@atproto/api/dist/client/types/app/bsky/actor/defs'
import { until } from '@vueuse/core'
import { reactive, ref } from 'vue'
import { identifier, password } from '../auth.json'

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

export const myFollows = await getAllFollows('zephire.nz')

export async function getRecentImagePosts(actor: string) {
  const { data, success } = await agent.getAuthorFeed({
    actor,
    filter: 'posts_with_media',
    limit: 10,
  })
  if (!success) throw new Error(`Failed to load posts for ${actor}`)

  return data.feed
}

type Crawl = {
  profile: ProfileView
  follows: number
}

export function useBskyCrawling() {
  const pause = ref(false)
  const crawls = reactive<Record<string, Crawl>>({})

  async function crawlFollows() {
    const toCrawl = myFollows
    // const toCrawl = nzGuys.data.items.map((u) => u.subject)

    for (const [idx, myFollow] of toCrawl.entries()) {
      // Enabling pausing
      await until(pause).not.toBeTruthy()
      console.log(`[${myFollow.handle}] processing ${idx}/${toCrawl.length}`)
      const followings = await getAllFollows(myFollow.did)
      const filtered = followings.filter((f) => !myFollows.some((mf) => mf.did === f.did))
      console.log(`[${myFollow.handle}] found ${filtered.length} filtered followers`)

      for (const follow of filtered) {
        if (!(follow.did in crawls)) {
          crawls[follow.did] = {
            profile: follow,
            follows: 1,
          }
        } else {
          crawls[follow.did].follows += 1
        }
      }
    }
  }

  return {
    crawls,
    crawlFollows,
    pause,
  }
}
