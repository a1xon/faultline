
# faultline (multithreaded)

Generate terrain images using fault line formation algorithm.

This version uses node's [worker_threads](https://nodejs.org/api/worker_threads.html) to calculate the image generation function on multiple cores. It just adds a couple of lines code and is still fairly easy to read.

On an AMD-FX-6100 it's twice as fast as the single-threaded algorithm.
1024x1024px & 2000 iterations :

 - single-threaded: 13849 ms 
 - multithreaded: 6723 ms

The Color-Buffer-Generation is still expensive (~600 ms) and could be optimized in a similar way.

 Forked from [faultline](https://github.com/barisusakli/faultline) by [barisusakli](https://github.com/barisusakli)

10 iterations | 50 iterations | 100 iterations

:-------------------------:|:-------------------------:|:---------------------------:

![](https://github.com/barisusakli/faultline/blob/master/10_iterations.png) | ![](https://github.com/barisusakli/faultline/blob/master/50_iterations.png) | ![](https://github.com/barisusakli/faultline/blob/master/100_iterations.png)

  

500 iterations | 1000 iterations | 2000 iterations

:-------------------------:|:-------------------------:|:---------------------------:

![](https://github.com/barisusakli/faultline/blob/master/500_iterations.png) | ![](https://github.com/barisusakli/faultline/blob/master/1000_iterations.png) | ![](https://github.com/barisusakli/faultline/blob/master/2000_iterations.png)