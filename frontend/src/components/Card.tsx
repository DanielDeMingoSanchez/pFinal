import React, { useState } from 'react';
import { useSpring, animated } from 'react-spring';
import styles from './Card.module.css';
import Button from './Button';

interface CardProps {
  documento: {
    id: string;
    titulo: string;
    descripcion: string;
    fechaCreacion: string;
    vistas: number;
    descargas: number;
  };
  onVerClick?: (id: string) => void;
  onDescargarClick?: (id: string) => void;
}

const Card: React.FC<CardProps> = ({ documento, onVerClick, onDescargarClick }) => {
  const [show, setShown] = useState(false);

  const props3 = useSpring({
    transform: show ? 'scale(1.03)' : 'scale(1)',
    boxShadow: show
      ? '0 20px 25px rgb(0 0 0 / 25%)'
      : '0 2px 10px rgb(0 0 0 / 8%)'
  });

  // Formatear la fecha
  const formatearFecha = (fechaStr: string) => {
    try {
      const fecha = new Date(fechaStr);
      return fecha.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch (e) {
      return fechaStr.substring(0, 10);
    }
  };

  // Limitar texto
  const limitarTexto = (texto: string, limite: number) => {
    if (texto.length <= limite) return texto;
    return texto.substring(0, limite) + '...';
  };

  return (
    <animated.div
      className={styles.card}
      style={props3}
      onMouseEnter={() => setShown(true)}
      onMouseLeave={() => setShown(false)}
    >
      <div className={styles.cardImage}>
        <div className={styles.cardIcon}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7.5 3.375c0-1.036.84-1.875 1.875-1.875h5.25c1.036 0 1.875.84 1.875 1.875v17.25c0 1.035-.84 1.875-1.875 1.875h-5.25c-1.036 0-1.875-.84-1.875-1.875V3.375z" fill="rgba(255,255,255,0.1)" />
            <path d="M12.75 15.75h-1.5a.75.75 0 000 1.5h1.5a.75.75 0 000-1.5zM8.25 13.5h7.5a.75.75 0 000-1.5h-7.5a.75.75 0 000 1.5zM8.25 10.5h7.5a.75.75 0 000-1.5h-7.5a.75.75 0 000 1.5zM13.5 6.75h-3a.75.75 0 000 1.5h3a.75.75 0 000-1.5z" />
          </svg>
        </div>
      </div>
      <h2 title={documento.titulo}>{limitarTexto(documento.titulo, 30)}</h2>
      <p title={documento.descripcion}>{limitarTexto(documento.descripcion, 80)}</p>
      <div className={styles.stats}>
        <span title="Fecha" className={styles.date}>
          {formatearFecha(documento.fechaCreacion)}
        </span>
        <div className={styles.statIcons}>
          <span title="Vistas">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 576 512">
              <path fill="currentColor" d="M572.52 241.4C518.29 135.59 410.93 64 288 64S57.68 135.64 3.48 241.41a32.35 32.35 0 0 0 0 29.19C57.71 376.41 165.07 448 288 448s230.32-71.64 284.52-177.41a32.35 32.35 0 0 0 0-29.19zM288 400a144 144 0 1 1 144-144 143.93 143.93 0 0 1-144 144zm0-240a95.31 95.31 0 0 0-25.31 3.79 47.85 47.85 0 0 1-66.9 66.9A95.78 95.78 0 1 0 288 160z"></path>
            </svg> {documento.vistas}
          </span>
          <span title="Descargas">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 512 512">
              <path fill="currentColor" d="M216 0h80c13.3 0 24 10.7 24 24v168h87.7c17.8 0 26.7 21.5 14.1 34.1L269.7 378.3c-7.5 7.5-19.8 7.5-27.3 0L90.1 226.1c-12.6-12.6-3.7-34.1 14.1-34.1H192V24c0-13.3 10.7-24 24-24zm296 376v112c0 13.3-10.7 24-24 24H24c-13.3 0-24-10.7-24-24V376c0-13.3 10.7-24 24-24h146.7l49 49c20.1 20.1 52.5 20.1 72.6 0l49-49H488c13.3 0 24 10.7 24 24zm-124 88c0-11-9-20-20-20s-20 9-20 20 9 20 20 20 20-9 20-20zm64 0c0-11-9-20-20-20s-20 9-20 20 9 20 20 20 20-9 20-20z"></path>
            </svg> {documento.descargas}
          </span>
        </div>
      </div>
      <div className={styles.btnn}>
        <Button text="Ver" onClick={() => onVerClick && onVerClick(documento.id)} />
        <Button text="Descargar" onClick={() => onDescargarClick && onDescargarClick(documento.id)} />
      </div>
    </animated.div>
  );
};

export default Card; 