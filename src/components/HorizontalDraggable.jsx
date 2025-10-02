import { useState, useRef, useEffect, useCallback } from 'react'

const IMAGE_WIDTH = 640;
const IMAGE_HEIGHT = 400;

const useCanvasDraggable = (initialX, maxNegativeX, onPositionChange, imageSources) => {
    const canvasRef = useRef(null);
    const contextRef = useRef(null);
    const isDraggingRef = useRef(false);
    const dragOffsetRef = useRef(0);
    const currentTranslateXRef = useRef(initialX);
    const [imagesLoaded, setImagesLoaded] = useState(false);
    const loadedImagesRef = useRef([]);
    const MIN_X = 0;

    // load all images
    useEffect(() => {
        const loadImages = async () => {
            const promises = imageSources.map((src) => {
                return new Promise((resolve, reject) => {
                    const img = new Image();
                    img.onload = () => resolve(img);
                    img.onerror = reject;
                    img.src = src;
                });
            });

            try {
                loadedImagesRef.current = await Promise.all(promises);
                setImagesLoaded(true);
            } catch (error) {
                console.error("error", error);
            }
        };

        loadImages();
    }, [imageSources]);

    const drawImages = useCallback((translateX) => {
        if (!contextRef.current || loadedImagesRef.current.length === 0) return;

        const ctx = contextRef.current;
        const canvas = canvasRef.current;

        // clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // redraw images at new position
        loadedImagesRef.current.forEach((img, index) => {
            const sourceX = index * IMAGE_WIDTH;
            ctx.drawImage(
                img,
                0, 0, // show full image
                img.width, img.height, 
                sourceX + translateX, 0, 
                IMAGE_WIDTH, canvas.height
            );
        });
    }, []);

    // redraw on X change
    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas && imagesLoaded) {
            contextRef.current = canvas.getContext('2d');
            // Initial draw
            drawImages(initialX);
        }
    }, [imagesLoaded, initialX, drawImages]);

    const handleMouseUp = useCallback(() => {
        if (isDraggingRef.current) {
            isDraggingRef.current = false;
            onPositionChange(currentTranslateXRef.current);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        }
    }, [onPositionChange]);

    const handleMouseMove = useCallback((e) => {
        if (!isDraggingRef.current || !canvasRef.current) return;

        let newX = e.clientX - dragOffsetRef.current;
        newX = Math.min(newX, MIN_X);
        newX = Math.max(newX, maxNegativeX);

        drawImages(newX);
        currentTranslateXRef.current = newX;

    }, [maxNegativeX, drawImages]);

    const handleMouseDown = useCallback((e) => {
        if (e.button !== 0 || !canvasRef.current) return;

        dragOffsetRef.current = e.clientX - currentTranslateXRef.current;
        isDraggingRef.current = true;

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        
    }, [handleMouseMove, handleMouseUp]);

    return { canvasRef, handleMouseDown };
};

export default function HorizontalCanvasDraggable() {
    const [x, setX] = useState(0);

    const handlePositionChange = useCallback((newX) => {
        setX(newX);
    }, []);

    const viewportWidth = IMAGE_WIDTH;
    const viewportHeight = IMAGE_HEIGHT;
    const imageWidth = IMAGE_WIDTH;
    const imageCount = 4;
    const totalDraggableWidth = imageCount * imageWidth;
    const maxNegativeX = -(totalDraggableWidth - viewportWidth);

    const images = [
        '/pic1.png',
        '/pic2.png',
        '/pic3.png',
        '/pic4.png'
    ];

    const { canvasRef, handleMouseDown } = useCanvasDraggable(
        x,
        maxNegativeX,
        handlePositionChange,
        images
    );

    const canvasStyle = {
        cursor: 'grab',
    };

    return (
        <div style={{ height: `${viewportHeight}px`, width: `${viewportWidth}px`, overflow: 'hidden' }}>
            <canvas
                ref={canvasRef}
                width={viewportWidth}
                height={viewportHeight}
                style={canvasStyle}
                onMouseDown={handleMouseDown}
            />
        </div>
    );
}
