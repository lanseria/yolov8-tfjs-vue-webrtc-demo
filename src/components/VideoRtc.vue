<script lang="ts" setup>
const props = defineProps({
  suuid: {
    type: String,
    required: true,
  },
})
const emits = defineEmits(['play'])
const src = computed(() => {
  return new URL(`ws://autopump-webrtc:1984/api/ws?src=${encodeURIComponent(props.suuid)}`, location.href).toString()
})
const DISCONNECT_TIMEOUT = 5000
const RECONNECT_TIMEOUT = 30000

const videoRef = ref<HTMLVideoElement>()
const errorMsg = ref('loading')
const state = reactive<{
  wsState: number
  pcState: number
  connectTS: number
  reconnectTID: number | any
  disconnectTID: number | any
  ws: WebSocket | null
  pcConfig: RTCConfiguration
  pc: RTCPeerConnection | null
  mseCodecs: string
  onmessage: any
  ondata: any
}>({
  wsState: WebSocket.CLOSED,
  pcState: WebSocket.CLOSED,
  connectTS: 0,
  reconnectTID: 0,
  disconnectTID: 0,
  ws: null,
  pcConfig: {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
  },
  pc: null,
  mseCodecs: '',
  onmessage: null,
  ondata: null,
})
watch(() => src.value, () => {
  onconnect()
})
function onconnect() {
  if (!src.value)
    return
  // CLOSED or CONNECTING => CONNECTING
  state.wsState = WebSocket.CONNECTING
  state.connectTS = Date.now()
  state.ws = new WebSocket(src.value)
  state.ws.binaryType = 'arraybuffer'
  state.ws.addEventListener('open', () => onopen())
  state.ws.addEventListener('close', () => onclose())
}
function ondisconnect() {
  state.wsState = WebSocket.CLOSED
  if (state.ws) {
    state.ws.close()
    state.ws = null
  }

  state.pcState = WebSocket.CLOSED
  if (state.pc) {
    state.pc.close()
    state.pc = null
  }
}
/**
 * @return {boolean} true if reconnection has started.
 */
function onclose() {
  if (state.wsState === WebSocket.CLOSED)
    return false

  // CONNECTING, OPEN => CONNECTING
  state.wsState = WebSocket.CONNECTING
  state.ws = null

  // reconnect no more than once every X seconds
  const delay = Math.max(RECONNECT_TIMEOUT - (Date.now() - state.connectTS), 0)

  state.reconnectTID = setTimeout(() => {
    state.reconnectTID = 0
    onconnect()
  }, delay)

  return true
}
/**
 * @returns {Array.<string>} of modes (mse, webrtc, etc.)
 */
function onopen() {
  // console.warn('onopen')
  // CONNECTING => OPEN
  state.wsState = WebSocket.OPEN

  state.ws && state.ws.addEventListener('message', (ev) => {
    // console.warn('ev.data', ev.data)
    if (typeof ev.data === 'string') {
      // console.log('ev.data is string')
      const msg = JSON.parse(ev.data)
      for (const mode in state.onmessage) {
        // console.warn('mode is ', mode)
        state.onmessage[mode](msg)
      }
    }
    else {
      // console.log('ev.data is obj')
      state.ondata(ev.data)
    }
  })

  state.ondata = null
  state.onmessage = {}

  const modes = []

  // console.log('before webrtc')
  if ('RTCPeerConnection' in window) { // macOS Desktop app
    // console.log('on webrtc')
    modes.push('webrtc')
    onwebrtc()
  }

  return modes
}
/**
 * Play video. Support automute when autoplay blocked.
 * https://developer.chrome.com/blog/autoplay/
 */
function play() {
  if (videoRef.value) {
    // console.warn('play')
    videoRef.value.play().catch((er) => {
      if (er.name === 'NotAllowedError' && !videoRef.value!.muted) {
        videoRef.value!.muted = true
        videoRef.value!.play().catch(() => console.warn)
      }
    })
  }
}
/**
 * @param ev {Event}
 */
function onpcvideo(ev: Event) {
  if (!state.pc)
    return

  const connectionState = state.pc.connectionState

  // Firefox doesn't support pc.connectionState
  if (connectionState === 'connected' || connectionState === 'connecting' || !connectionState) {
    play()

    state.pcState = WebSocket.OPEN

    state.wsState = WebSocket.CLOSED
    state.ws!.close()
    state.ws = null
  }
}
/**
 * Send message to server via WebSocket
 * @param {Object} value
 */
function send(value: any) {
  if (state.ws)
    state.ws.send(JSON.stringify(value))
}
function onwebrtc() {
  const pc = new RTCPeerConnection(state.pcConfig)

  pc.addEventListener('icecandidate', (ev) => {
    const candidate = ev.candidate ? ev.candidate.toJSON().candidate : ''
    // console.log('icecandidate', candidate)
    send({ type: 'webrtc/candidate', value: candidate })
  })

  pc.addEventListener('track', (ev) => {
    // console.log('track: ', ev)
    // when stream already init
    if (videoRef.value?.srcObject !== null) {
      console.warn('srcObject is null')
      return
    }

    // when audio track not exist in Chrome
    if (ev.streams.length === 0) {
      // console.warn('streams length is 0')
      return
    }

    if (videoRef.value) {
      // console.warn('ev.streams[0] ', ev.streams[0])
      videoRef.value.srcObject = ev.streams[0]
    }
  })

  pc.addEventListener('connectionstatechange', () => {
    if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
      pc.close() // stop next events

      state.pcState = WebSocket.CLOSED
      state.pc = null

      onconnect()
    }
  })

  state.onmessage.webrtc = (msg: any) => {
    // console.log('onmessage.webrtc', msg)
    errorMsg.value = ''
    switch (msg.type) {
      case 'webrtc/candidate':
        pc.addIceCandidate({
          candidate: msg.value,
          sdpMid: '0',
        }).catch(() => console.warn)
        break
      case 'webrtc/answer':
        pc.setRemoteDescription({
          type: 'answer',
          sdp: msg.value,
        }).catch(() => console.warn)
        break
      case 'error':
        console.error('onmessage.webrtc', msg)
        errorMsg.value = msg.value
        if (!msg.value.includes('webrtc/offer'))
          return
        pc.close()
    }
  }

  // Safari doesn't support "offerToReceiveVideo"
  pc.addTransceiver('video', { direction: 'recvonly' })
  pc.addTransceiver('audio', { direction: 'recvonly' })

  pc.createOffer().then((offer) => {
    pc.setLocalDescription(offer).then(() => {
      send({ type: 'webrtc/offer', value: offer.sdp })
    })
  })

  state.pcState = WebSocket.CONNECTING
  state.pc = pc
}

function handleFullScreen() {
  //
  videoRef.value?.requestFullscreen()
}
onMounted(() => {
  if (state.disconnectTID) {
    clearTimeout(state.disconnectTID)
    state.disconnectTID = 0
  }
  onconnect()
})
onBeforeUnmount(() => {
  if (state.disconnectTID)
    return
  if (state.wsState === WebSocket.CLOSED && state.pcState === WebSocket.CLOSED)
    return

  state.disconnectTID = setTimeout(() => {
    if (state.reconnectTID) {
      clearTimeout(state.reconnectTID)
      state.reconnectTID = 0
    }

    state.disconnectTID = 0

    ondisconnect()
  }, DISCONNECT_TIMEOUT)
})
function onPlay() {
  emits('play', videoRef)
}
</script>

<template>
  <div class="bg-neutral-7 aspect-custom relative rounded-md w-full h-full video-wrap">
    <FullScreenBtn class="top-0 right-0 z-1 fullscreen-wrap hidden" @click.stop="handleFullScreen" />
    <div class="absolute flex justify-center items-center h-full w-full">
      {{ errorMsg }}
    </div>
    <div v-if="errorMsg" class="absolute top-5px left-5px w-10px h-10px bg-red border border-white border-1px rounded-1/2" />
    <div v-else class="absolute top-5px left-5px w-10px h-10px bg-green border border-white border-1px rounded-1/2" />
    <video ref="videoRef" class="aspect-custom h-full w-full rounded-md" autoplay muted @loadeddata.once="onpcvideo" @play="onPlay" />
  </div>
</template>

<style lang="css" scoped>
.video-wrap:hover .fullscreen-wrap {
  display: block;
}

.aspect-custom {
  aspect-ratio: 16/9;
  object-fit: fill;
}
</style>
