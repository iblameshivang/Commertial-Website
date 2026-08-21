import React, { useEffect, useMemo, useRef, useState } from 'react';
import { resolveImageUrl } from './config';

const ZOOM_LEVEL = 2.5;
const LENS_SIZE = 150;

export default function ProductImageGallery({ images, productName }) {
  const safeImages = useMemo(() => {
    const normalizedImages = Array.isArray(images) ? images.filter(Boolean) : [];
    if (normalizedImages.length > 0) {
      return normalizedImages.map(image => resolveImageUrl(image));
    }

    return [resolveImageUrl('/images/no-image.svg')];
  }, [images]);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showZoom, setShowZoom] = useState(false);
  const [lensStyle, setLensStyle] = useState({});
  const [zoomStyle, setZoomStyle] = useState({});
  const imageStageRef = useRef(null);
  const touchStartXRef = useRef(null);
  const touchDeltaXRef = useRef(0);

  useEffect(() => {
    setSelectedIndex(currentIndex => Math.min(currentIndex, Math.max(safeImages.length - 1, 0)));
    setShowZoom(false);
  }, [safeImages]);

  const selectedImage = safeImages[selectedIndex] || safeImages[0] || resolveImageUrl('/images/no-image.svg');

  const updateMagnifier = (clientX, clientY) => {
    const stage = imageStageRef.current;
    if (!stage) {
      return;
    }

    const rect = stage.getBoundingClientRect();
    const width = rect.width || 1;
    const height = rect.height || 1;
    const pointerX = Math.min(Math.max(clientX - rect.left, 0), width);
    const pointerY = Math.min(Math.max(clientY - rect.top, 0), height);

    const percentX = pointerX / width;
    const percentY = pointerY / height;
    const lensHalf = LENS_SIZE / 2;
    const lensLeft = Math.min(Math.max(pointerX - lensHalf, 0), width - LENS_SIZE);
    const lensTop = Math.min(Math.max(pointerY - lensHalf, 0), height - LENS_SIZE);

    setLensStyle({
      left: `${lensLeft}px`,
      top: `${lensTop}px`,
      backgroundImage: `url(${selectedImage})`,
      backgroundSize: `${width * ZOOM_LEVEL}px ${height * ZOOM_LEVEL}px`,
      backgroundPosition: `${(percentX * 100).toFixed(2)}% ${(percentY * 100).toFixed(2)}%`,
      backgroundRepeat: 'no-repeat'
    });

    setZoomStyle({
      backgroundImage: `url(${selectedImage})`,
      backgroundSize: `${width * ZOOM_LEVEL}px ${height * ZOOM_LEVEL}px`,
      backgroundPosition: `${(percentX * 100).toFixed(2)}% ${(percentY * 100).toFixed(2)}%`
    });
  };

  const handleMouseMove = event => {
    if (window.innerWidth <= 768) {
      return;
    }

    setShowZoom(true);
    updateMagnifier(event.clientX, event.clientY);
  };

  const handleMouseLeave = () => {
    setShowZoom(false);
  };

  const handleTouchStart = event => {
    if (event.touches && event.touches[0]) {
      touchStartXRef.current = event.touches[0].clientX;
      touchDeltaXRef.current = 0;
    }
  };

  const handleTouchMove = event => {
    if (typeof touchStartXRef.current !== 'number' || !event.touches || !event.touches[0]) {
      return;
    }

    touchDeltaXRef.current = event.touches[0].clientX - touchStartXRef.current;
  };

  const handleTouchEnd = () => {
    if (typeof touchStartXRef.current !== 'number') {
      return;
    }

    const threshold = 40;
    if (touchDeltaXRef.current <= -threshold) {
      setSelectedIndex(currentIndex => Math.min(currentIndex + 1, safeImages.length - 1));
    } else if (touchDeltaXRef.current >= threshold) {
      setSelectedIndex(currentIndex => Math.max(currentIndex - 1, 0));
    }

    touchStartXRef.current = null;
    touchDeltaXRef.current = 0;
  };

  return (
    <>
      <div className="desktop-gallery-shell">
        <div className="thumbnail-column" aria-label="Product image thumbnails">
          {safeImages.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              className={`thumbnail-button ${selectedIndex === index ? 'active' : ''}`}
              onClick={() => setSelectedIndex(index)}
              aria-label={`View product image ${index + 1}`}
              aria-pressed={selectedIndex === index}
            >
              <img src={image} alt={`${productName || 'Product'} view ${index + 1}`} />
            </button>
          ))}
        </div>

        <div className="gallery-main-stage">
          <div
            className="gallery-image-surface"
            ref={imageStageRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <img
              className="gallery-main-image"
              src={selectedImage}
              alt={productName || 'Product image'}
              onError={event => {
                event.currentTarget.src = resolveImageUrl('/images/no-image.svg');
              }}
            />
            {showZoom && (
              <div className="gallery-lens" style={lensStyle} aria-hidden="true" />
            )}
          </div>
        </div>

        <div className={`gallery-zoom-panel ${showZoom ? 'visible' : ''}`} aria-hidden={!showZoom}>
          <div className="gallery-zoom-surface" style={zoomStyle} />
        </div>
      </div>

      <div className="mobile-gallery-shell" aria-label="Mobile product gallery">
        <div
          className="mobile-gallery-track"
          style={{ transform: `translateX(-${selectedIndex * 100}%)` }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {safeImages.map((image, index) => (
            <div className="mobile-gallery-slide" key={`${image}-${index}`}>
              <img
                src={image}
                alt={`${productName || 'Product'} view ${index + 1}`}
                onError={event => {
                  event.currentTarget.src = resolveImageUrl('/images/no-image.svg');
                }}
              />
            </div>
          ))}
        </div>

        {safeImages.length > 1 && (
          <div className="gallery-indicator" aria-live="polite" aria-atomic="true">
            <span>{selectedIndex + 1}</span>
            <span className="slash">/</span>
            <span>{safeImages.length}</span>
          </div>
        )}
      </div>
    </>
  );
}
