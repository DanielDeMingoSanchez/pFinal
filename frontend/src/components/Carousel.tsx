import React, { useState, useEffect } from "react";
import Carousel3D from "react-spring-3d-carousel";
import { config } from "react-spring";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import styles from "./Carousel.module.css";

interface CarouselProps {
  cards: {
    key: string;
    content: React.ReactNode;
  }[];
  height?: string;
  width?: string;
  margin?: string;
  offset?: number;
  showArrows?: boolean;
}

const Carousel: React.FC<CarouselProps> = (props) => {
  const table = props.cards.map((element, index) => ({
    ...element,
    onClick: () => setGoToSlide(index),
  }));

  const [offsetRadius, setOffsetRadius] = useState(2);
  const [showArrows, setShowArrows] = useState(false);
  const [goToSlide, setGoToSlide] = useState<number | undefined>(undefined);
  const [cards, setCards] = useState(table);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    setOffsetRadius(props.offset || 2);
    setShowArrows(props.showArrows || false);
    setCards(table);
  }, [props.offset, props.showArrows, props.cards]);

  const handlePrev = () => {
    const newIndex = currentSlide === 0 ? cards.length - 1 : currentSlide - 1;
    setCurrentSlide(newIndex);
    setGoToSlide(newIndex);
  };

  const handleNext = () => {
    const newIndex = (currentSlide + 1) % cards.length;
    setCurrentSlide(newIndex);
    setGoToSlide(newIndex);
  };

  return (
    <div
      className={`${styles.carouselWrapper} relative`}
      style={{
        width: props.width || "80%",
        height: props.height || "500px",
        margin: props.margin || "0 auto",
      }}
    >
      <Carousel3D
        slides={cards}
        goToSlide={goToSlide}
        offsetRadius={offsetRadius}
        showNavigation={false} // Desactivamos flechas por defecto
        animationConfig={config.gentle}
      />

      {showArrows && (
        <>
          <button
            className={`${styles.arrowButton} ${styles.leftArrow}`}
            onClick={handlePrev}
            aria-label="Anterior"
          >
            <FaChevronLeft size={20} />
          </button>

          <button
            className={`${styles.arrowButton} ${styles.rightArrow}`}
            onClick={handleNext}
            aria-label="Siguiente"
          >
            <FaChevronRight size={20} />
          </button>
        </>
      )}
    </div>
  );
};

export default Carousel;
