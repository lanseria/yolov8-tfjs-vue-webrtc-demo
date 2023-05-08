export function isWebGPUSupported(): boolean {
  return ((typeof window !== 'undefined') ||
    //@ts-ignore
    (typeof WorkerGlobalScope !== 'undefined')) &&
    !!navigator.gpu;
}
