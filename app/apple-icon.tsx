import { ImageResponse } from 'next/og'

// Route segment config
export const runtime = 'edge'

// Image metadata
export const size = {
  width: 180,
  height: 180,
}
export const contentType = 'image/png'

// Image generation
export default function Icon() {
  return new ImageResponse(
    (
      // ImageResponse JSX element
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'white',
        }}
      >
        <img 
          src="https://utfs.io/f/vsxOYx8jne165wyeoiHgeTEz7hN19sBwDyrvKxioc2kQLnp3"
          alt="Dibs Logo"
          style={{
            width: '160px',
            height: '160px',
            objectFit: 'contain',
          }}
        />
      </div>
    ),
    // ImageResponse options
    {
      ...size,
    }
  )
} 