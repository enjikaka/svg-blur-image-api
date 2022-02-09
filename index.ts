import { serve } from 'https://deno.land/std@0.114.0/http/server.ts';
import { loadImage, createCanvas } from 'https://deno.land/x/canvas@v1.4.1/mod.ts';

class RequestError extends Error {}

async function handler (req: Request) {
  const url = new URL(req.url);
  const imageUrl = url.searchParams.get('imageUrl');
  const rawBlurRadius = url.searchParams.get('blurRadius') ?? '50';
  const blurRadius = parseInt(rawBlurRadius, 10)

  if (!imageUrl) {
    throw new RequestError('No image url');
  }

  const img = await loadImage(imageUrl);

  const canvas = createCanvas(80, 80);
  const ctx = canvas.getContext('2d');

  ctx.drawImage(
    img,
    0,
    0,
    img.width(),
    img.height(),
    0,
    0,
    canvas.width,
    canvas.height,
  );

  const rects: string[] = [];
  const step = blurRadius / 10;

  for (let x = 0; x <= canvas.width; x += step) {
    for (let y = 0; y <= canvas.height; y += step) {
      try {
        const imageData = ctx.getImageData(x, y, 1, 1);

        if (imageData) {
          const [r, g, b] = imageData.data;
          const fill = `rgb(${[r, g, b].join(',')})`;

          console.log(rects);

          rects.push(
            `<rect x="${x}" y="${y}" width="${step}" height="${step}" fill="${fill}"/>`,
          );
        }
      } catch (e) {
        console.log(e);
        throw new Error(`Unable to access canvas image data: ${e}`);
      }
    }
  }

  const svgStyle = `filter:blur(${blurRadius}px);-webkit-filter:blur(${blurRadius}px)`;
  const svgMarkup = `
    <svg
      style="${svgStyle}"
      viewBox="0 0 80 80"
      xmlns="http://www.w3.org/2000/svg"
    >
      ${rects.join('')}
    </svg>
  `.trim();

  return new Response(svgMarkup, {
    status: 200,
    headers: new Headers({
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'max-age=31536000'
    })
  });
}

console.log("Listening on http://localhost:8000");

await serve(req => {
  try {
    return handler(req);
  } catch (e) {
    return new Response(e.message, {
      status: e instanceof RequestError ? 400 : 500
    });
  }
});