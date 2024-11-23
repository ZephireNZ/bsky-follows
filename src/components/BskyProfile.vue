<script lang="ts" setup>
import { computed } from 'vue'
import { Card, Galleria, Avatar } from 'primevue'
import { computedAsync } from '@vueuse/core'
import { isView as isImageView } from '@atproto/api/dist/client/types/app/bsky/embed/images'
import { isView as isVideoView } from '@atproto/api/dist/client/types/app/bsky/embed/video'
import { isRecord as isPostRecord } from '@atproto/api/dist/client/types/app/bsky/feed/post'
import { VideoPlayer } from '@videojs-player/vue'
import 'video.js/dist/video-js.css'
import { useBskyCrawling } from '@/composables/bluesky'

const { getRecentImagePosts, getProfile } = useBskyCrawling()

const { did, rank, follows } = defineProps<{
  did: string
  rank: number
  follows: number
}>()

const profile = await getProfile(did)

const imagePosts = computedAsync(
  async () => {
    const posts = await getRecentImagePosts(did)

    return posts
      .map((p) => {
        if (!isPostRecord(p.post.record)) return null
        const record = p.post.record

        if (isImageView(p.post.embed)) {
          const image = p.post.embed.images[0]

          return {
            image: image.fullsize,
            thumb: image.thumb,
            text: record.text,
            posted: record.createdAt,
          }
        }
        if (isVideoView(p.post.embed)) {
          const video = p.post.embed

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
  <Card class="h-full">
    <template #header>
      <Galleria :value="imagePosts" :num-visible="3" class="h-full">
        <template #item="{ item }">
          <div class="flex flex-col bg-surface-900 w-full">
            <img v-if="item.image" :src="item.image" class="w-full object-scale-down max-h-96" />
            <VideoPlayer
              v-if="item.video"
              class="w-full"
              :src="item.video"
              :poster="item.thumb"
              :height="386"
              muted
              plays-inline
              controls
            />
            <div class="m-4 text-xs font-medium text-white" style="white-space: pre-wrap">
              {{ item.text }}
            </div>
          </div>
        </template>
        <template #thumbnail="{ item }">
          <img :src="item.thumb" class="size-20 object-cover" />
        </template>
      </Galleria>
    </template>
    <template #title>
      <a :href="`https://bsky.app/profile/${profile.handle}`" target="_blank">
        <div class="flex gap-2 items-center">
          <div class="text-4xl font-bold">
            {{ rank }}
          </div>
          <Avatar
            :key="profile.did"
            :image="profile.avatar"
            :icon="!profile.avatar ? 'pi pi-user' : undefined"
            size="large"
            shape="circle"
          />
          <div>{{ showDisplayName ? profile.displayName : profile.handle }}</div>
        </div>
      </a>
    </template>
    <template #subtitle>
      <div class="inline-flex gap-1 items-center">
        <a :href="`https://bsky.app/profile/${profile.handle}`" target="_blank">
          {{ profile.handle }}
        </a>
        <span class="font-normal text-sm italic">({{ follows }} of my follows)</span>
      </div>
    </template>
    <template #content>
      <p style="white-space: pre-wrap">{{ profile.description }}</p>
    </template>
  </Card>
</template>
