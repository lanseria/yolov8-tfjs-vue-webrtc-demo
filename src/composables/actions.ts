import * as tf from '@tensorflow/tfjs'

import '@tensorflow/tfjs-backend-webgl'
import { tfjsLoading, tfjsProgress } from './global'

export function loadTfModels() {
  tf.ready().then(async () => {
    const yolov8 = await tf.loadGraphModel(
        `${window.location.href}/${modelName}_web_model/model.json`,
        {
          onProgress: (fractions) => {
            tfjsLoading.value = true
            tfjsProgress.value = fractions
          },
        },
    ) // load model

    // warming up model
    if (yolov8.inputs[0].shape) {
      const dummyInput = tf.ones(yolov8.inputs[0].shape)
      const warmupResults = yolov8.execute(dummyInput)
      tfjsLoading.value = false
      tfjsProgress.value = 1
      model.net = yolov8
      inputShape.value = yolov8.inputs[0].shape
      tf.dispose([warmupResults, dummyInput]) // cleanup memory
    }
  })
}

export function initNet() {
  tf.disposeVariables()
}
