import React from 'react';
import styles from './Button.module.css';

interface ButtonProps {
  text: string;
  onClick?: () => void;
}

function Button({ text, onClick }: ButtonProps) {
  return <button className={styles.btn} onClick={onClick}>{text}</button>;
}

export default Button; 