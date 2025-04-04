import React from 'react';
import { IconType } from 'react-icons';

interface IconWrapperProps {
  icon: IconType;
  size?: number;
  color?: string;
  className?: string;
}

const IconWrapper: React.FC<IconWrapperProps> = ({ icon: Icon, size = 24, color, className }) => {
  return (
    <div className={className}>
      <Icon size={size} color={color} />
    </div>
  );
};

export default IconWrapper; 