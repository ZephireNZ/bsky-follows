<script lang="ts" setup>
import type { ProfileView } from '@atproto/api/dist/client/types/app/bsky/actor/defs'
import { computed, ref } from 'vue'
import Galleria from 'primevue/galleria'
import { computedAsync } from '@vueuse/core'
import { isView as isImageView } from '@atproto/api/dist/client/types/app/bsky/embed/images'
import { isView as isVideoView } from '@atproto/api/dist/client/types/app/bsky/embed/video'
import { isRecord as isPostRecord } from '@atproto/api/dist/client/types/app/bsky/feed/post'
import { VideoPlayer } from '@videojs-player/vue'
import 'video.js/dist/video-js.css'
import { useBskyCrawling } from '@/composables/bluesky'

const { getRecentImagePosts } = useBskyCrawling()

const {
  rank = 1,
  follows = 1,
  profile,
} = defineProps<{
  rank: number
  follows: number
  profile: ProfileView
}>()

const maxWidth = ref(200)
const maxHeight = ref(200)

const ratioWidth = 500
const ratioHeight = computed(() => (maxWidth.value / maxHeight.value) * ratioWidth)

const imagePosts = computedAsync(
  async () => {
    const posts = await getRecentImagePosts(profile.did)

    return posts
      .map((p) => {
        if (!isPostRecord(p.post.record)) return null
        const record = p.post.record

        if (isImageView(p.post.embed)) {
          const image = p.post.embed.images[0]

          maxWidth.value = Math.max(maxWidth.value, image.aspectRatio?.width ?? 0)
          maxHeight.value = Math.max(maxHeight.value, image.aspectRatio?.height ?? 0)

          return {
            image: image.fullsize,
            thumb: image.thumb,
            text: record.text,
            posted: record.createdAt,
          }
        }
        if (isVideoView(p.post.embed)) {
          const video = p.post.embed

          maxWidth.value = Math.max(maxWidth.value, video.aspectRatio?.width ?? 0)
          maxHeight.value = Math.max(maxHeight.value, video.aspectRatio?.height ?? 0)

          return {
            video: video.playlist,
            thumb: video.thumbnail,
            text: record.text,
            posted: record.createdAt,
          }
        }

        if (!isImageView(p.post.embed)) return null
      })
      .filter((p) => p != null)
  },
  [],
  {
    lazy: true,
  },
)

const showDisplayName = computed(() => !!profile.displayName && profile.displayName !== '')
</script>

<template>
  <div class="flex-column">
    <a :href="`https://bsky.app/profile/${profile.handle}`" target="_blank">
      <div class="flex min-w-0 gap-x-4">
        <div class="text-4xl font-bold">
          {{ rank }}
        </div>
        <img class="size-32 flex-none rounded-full bg-gray-50" :src="profile.avatar" />
        <div class="min-w-0 flex-auto">
          <p class="text-sm/6 font-semibold text-gray-900">
            {{ showDisplayName ? profile.displayName : profile.handle }}
            <span class="font-normal">({{ follows }} of my follows)</span>
          </p>
          <p class="mt-1 truncate text-xs/5 text-gray-500">
            {{ profile.handle }}
          </p>

          <hr class="m-2" />

          <p style="white-space: pre-wrap">{{ profile.description }}</p>
        </div>
      </div>
    </a>
    <div class="mt-4" style="width: 500px">
      <Galleria :value="imagePosts" :num-visible="4">
        <template #item="{ item }">
          <div class="flex flex-col bg-surface-900 w-full min-w-full">
            <img
              v-if="item.image"
              :src="item.image"
              class="w-full object-contain"
              style="height: 500px"
            />
            <VideoPlayer
              v-if="item.video"
              :src="item.video"
              :poster="item.thumb"
              :volume="0"
              controls
              :height="500"
              style="align-self: center"
            />
            <div class="m-4 text-xl font-medium text-white" style="white-space: pre-wrap">
              {{ item.text }}
            </div>
          </div>
        </template>
        <template #thumbnail="{ item }">
          <img :src="item.thumb" class="size-20 object-cover" />
        </template>
      </Galleria>
    </div>
  </div>
</template>
