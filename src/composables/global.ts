import type { GraphModel, io } from '@tensorflow/tfjs'
import '@tensorflow/tfjs-backend-webgl'

export * as tf from '@tensorflow/tfjs'

export const model: {
  net: GraphModel<string | io.IOHandler> | null
} = {
  net: null,
}
export const inputShape = ref<number[]>([1, 0, 0, 3])
// model configs
export const modelName = 'yolov8n'
