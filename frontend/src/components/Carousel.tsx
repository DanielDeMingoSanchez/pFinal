import React, { useState, useEffect } from "react";
import Carousel3D from "react-spring-3d-carousel";
import { config } from "react-spring";
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
  const table = props.cards.map((element, index) => {
    return { ...element, onClick: () => setGoToSlide(index) };
  });

  const [offsetRadius, setOffsetRadius] = useState(2);
  const [showArrows, setShowArrows] = useState(false);
  const [goToSlide, setGoToSlide] = useState<number | null>(null);
  const [cards] = useState(table);

  useEffect(() => {
    setOffsetRadius(props.offset || 2);
    setShowArrows(props.showArrows || false);
  }, [props.offset, props.showArrows]);

  return (
    <div
      className={styles.carouselWrapper}
      style={{ 
        width: props.width || "80%", 
        height: props.height || "500px", 
        margin: props.margin || "0 auto" 
      }}
    >
      <Carousel3D
        slides={cards}
        goToSlide={goToSlide}
        offsetRadius={offsetRadius}
        showNavigation={showArrows}
        animationConfig={config.gentle}
      />
      
      {/* Indicadores de diapositivas
      <div className={styles.indicators}>
        {cards.map((_, index) => (
          <button
            key={index}
            className={`${styles.indicator} ${goToSlide === index ? styles.active : ''}`}
            onClick={() => setGoToSlide(index)}
            aria-label={`Ir a diapositiva ${index + 1}`}
          />
        ))}
        
      </div> */}
    </div>
  );
};

export default Carousel; 