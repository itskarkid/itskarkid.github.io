---
title: Blur
folder: machine-vision
stage: evergreen
confidence: high
created: 2026-10-27
lastTended: 2026-10-27
tags:
  - course-note
  - machine-vision
  - image-processing
  - image-filtering
  - opencv
publish: true
---
The filters smooth an image by replacing a pixel with a value calculated from its neighborhood.

> [!summary]- Mental Model
> ![[blur.png]]


The difference is **how much importance each neighboring pixel receives**.

### Averaging Blur

An averaging filter gives every pixel in the neighborhood the same weight.

For a `3×3` kernel:

$$  
K=\frac{1}{9}  
\begin{bmatrix}  
1&1&1\\  
1&1&1\\ 
1&1&1  
\end{bmatrix}  
$$

Suppose the image neighbourhood is:

$$ 
\begin{bmatrix}  
10&10&10\\  
10&100&10\\  
10&10&10  
\end{bmatrix}  
$$

Then:

$$  
\frac{10+10+10+10+100+10+10+10+10}{9}=20  
$$

So:

```
100 → 20
```

> [!abstract]+ In Short:
> Averaging blur
> → all neighbouring pixels are equally important

This smooths the image, but it can blur edges and fine details.

### Gaussian Blur

A Gaussian filter gives more weight to pixels near the centre.

A simplified `3×3` Gaussian kernel is:

$$  
K=\frac{1}{16}  
\begin{bmatrix}  
1&2&1\\  
2&4&2\\  
1&2&1  
\end{bmatrix}  
$$

For the same image neighbourhood:

$$  
\begin{bmatrix}  
10&10&10\\  
10&100&10\\  
10&10&10  
\end{bmatrix}  
$$

the weighted sum is:

$$ 
10(1)+10(2)+10(1)+10(2)+100(4)+10(2)+10(1)+10(2)+10(1)  = 520
$$

Then divide by the total weight:

$$ 
1+2+1+2+4+2+1+2+1=16  
$$

So:

$$  
520/16=32.5  
$$

Therefore:

```
Average blur  → 20
Gaussian blur → 32.5
```

The Gaussian result stays closer to the original centre value because the centre has more influence.

> [!abstract]+ In Short
> Average blur
> → equal weights
> Gaussian blur
> → centre has more weight
> → nearby pixels matter more
> → distant pixels matter less

### Why Gaussian Blur Is Common

Gaussian blur usually gives more natural smoothing because nearby pixels influence the result more strongly than pixels farther away.

It is commonly used for:

```
noise reduction
↓
smoothing
↓
pre-processing before edge detection
```

In OpenCV:

```
cv2.blur(image, (3, 3))

cv2.GaussianBlur(image, (3, 3), 0)
```

> [!important] The key idea is:
> Averaging blur treats all neighbours equally, while Gaussian blur gives more importance to pixels closer to the centre.