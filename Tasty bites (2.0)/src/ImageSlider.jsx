import React, { useState, useEffect } from 'react';
import './index.css';

const images = [
  '/menu/v3.mp4',
  '/menu/img4.avif',
  '/menu/img5.jpg',
  '/img4.jpeg',
  '/img2.jpeg',
  '/img3.jpeg',
  '/img1.jpeg',
  '/menu/img4.avif',
];

const ImageSlider = () => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const isVideo = (url) => url.endsWith('.mp4');

  return (
    <div className="image-slider-container position-relative w-100 h-100 overflow-hidden">
      {images.map((media, index) => (
        <div
          key={index}
          className={`slider-item ${index === current ? 'active' : ''}`}
        >
          {isVideo(media) ? (
            <video
              className="media w-100 h-100"
              autoPlay
              muted
              loop
              playsInline
            >
              <source src={media} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          ) : (
            <img
              src={media}
              alt={`slide-${index}`}
              className="media w-100 h-100"
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default ImageSlider;
