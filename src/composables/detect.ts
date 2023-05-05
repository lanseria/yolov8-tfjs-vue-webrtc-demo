import type { Rank, Tensor, Tensor1D, Tensor2D, Tensor3D } from '@tensorflow/tfjs'
import labels from '~/utils/labels.json'
import { renderBoxes } from '~/utils/renderBox'

const numClass = labels.length

/**
 * Preprocess image / frame before forwarded into the model
 * @param {HTMLVideoElement|HTMLImageElement} source
 * @param {Number} modelWidth
 * @param {Number} modelHeight
 * @returns input tensor, xRatio and yRatio
 */
function preprocess(source: HTMLVideoElement | HTMLImageElement, modelWidth: number, modelHeight: number): [Tensor, number, number] {
  let xRatio = 0
  let yRatio = 0
  // ratios for boxes

  const input = tf.tidy(() => {
    const img = tf.browser.fromPixels(source)

    // padding image to square => [n, m] to [n, n], n > m
    const [h, w] = img.shape.slice(0, 2) // get source width and height
    const maxSize = Math.max(w, h) // get max size
    const imgPadded = img.pad([
      [0, maxSize - h], // padding y [bottom only]
      [0, maxSize - w], // padding x [right only]
      [0, 0],
    ]) as Tensor3D

    xRatio = maxSize / w // update xRatio
    yRatio = maxSize / h // update yRatio

    return tf.image
      .resizeBilinear(imgPadded, [modelWidth, modelHeight]) // resize frame
      .div(255.0) // normalize
      .expandDims(0) // add batch
  })

  return [input, xRatio, yRatio]
}

/**
 * Function run inference and do detection from source.
 * @param {HTMLImageElement|HTMLVideoElement} source
 * @param {tf.GraphModel} model loaded YOLOv8 tensorflow.js model
 * @param {HTMLCanvasElement} canvasRef canvas reference
 * @param {VoidFunction} callback function to run after detection process
 */
export async function detect(source: HTMLImageElement | HTMLVideoElement, canvasRef: HTMLCanvasElement, callback = () => {}) {
  tf.engine().startScope() // start scoping tf engine
  const [modelWidth, modelHeight] = inputShape.value.slice(1, 3) // get model width and height
  // console.log(modelWidth, modelHeight)
  const [input, xRatio, yRatio] = preprocess(source, modelWidth, modelHeight) // preprocess image
  // console.log(model.net)

  const res = model.net!.execute(input!) as Tensor<Rank> // inference model
  const transRes = res.transpose([0, 2, 1]) // transpose result [b, det, n] => [b, n, det]
  const boxes = tf.tidy(() => {
    const w = transRes.slice([0, 0, 2], [-1, -1, 1]) // get width
    const h = transRes.slice([0, 0, 3], [-1, -1, 1]) // get height
    const x1 = tf.sub(transRes.slice([0, 0, 0], [-1, -1, 1]), tf.div(w, 2)) // x1
    const y1 = tf.sub(transRes.slice([0, 0, 1], [-1, -1, 1]), tf.div(h, 2)) // y1
    return tf
      .concat(
        [
          y1,
          x1,
          tf.add(y1, h), // y2
          tf.add(x1, w), // x2
        ],
        2,
      )
      .squeeze()
  }) as Tensor2D // process boxes [y1, x1, y2, x2]

  const [scores, classes] = tf.tidy(() => {
    const rawScores = transRes.slice([0, 0, 4], [-1, -1, numClass]).squeeze() // class scores
    return [rawScores.max(1), rawScores.argMax(1)]
  }) as [Tensor1D, Tensor2D ] // get max scores and classes index

  const nms = await tf.image.nonMaxSuppressionAsync(boxes, scores, 500, 0.45, 0.2) // NMS to filter boxes

  const boxes_data = await boxes.gather(nms, 0).data()
  const scores_data = await scores.gather(nms, 0).data()
  const classes_data = await classes.gather(nms, 0).data()

  renderBoxes(canvasRef, boxes_data, scores_data, classes_data, [xRatio, yRatio])

  tf.dispose([res, transRes, boxes, scores, classes, nms])
  callback()
  tf.engine().endScope()
}

/**
 * Function to detect video from every source.
 * @param {HTMLVideoElement} vidSource video source
 * @param {tf.GraphModel} model loaded YOLOv8 tensorflow.js model
 * @param {HTMLCanvasElement} canvasRef canvas reference
 */
export function detectVideo(vidSource: HTMLVideoElement, canvasRef: HTMLCanvasElement) {
  /**
   * Function to detect every frame from video
   */
  // console.log(vidSource, canvasRef)
  const detectFrame = async () => {
    if (vidSource.videoWidth === 0 && vidSource.srcObject === null) {
      console.warn('vidSource.srcObject === null')
      const ctx = canvasRef.getContext('2d')
      ctx && ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height) // clean canvas
      return // handle if source is closed
    }

    detect(vidSource, canvasRef, () => {
      requestAnimationFrame(detectFrame) // get another frame
    })
  }

  detectFrame() // initialize to detect every frame
}
