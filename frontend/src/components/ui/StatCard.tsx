import React from 'react';
import { motion } from 'framer-motion';
import { IconType } from 'react-icons';

interface StatCardProps {
  title: string;
  value: number;
  icon: IconType;
  color: string;
  bgColor: string;
  prefix?: string;
  suffix?: string;
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  color,
  bgColor,
  prefix = '',
  suffix = '',
  className = ''
}) => {
  return (
    <motion.div
      className={`p-6 rounded-lg shadow-sm hover:shadow-md bg-white dark:bg-gray-800 dark:border dark:border-gray-700 flex flex-col items-center text-center transition-all duration-300 ${className}`}
      whileHover={{ 
        y: -5,
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
    >
      <motion.div
        className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
        style={{ backgroundColor: bgColor }}
        whileHover={{ scale: 1.1 }}
        transition={{ type: "spring", stiffness: 400, damping: 10 }}
      >
        <Icon size={28} color={color} />
      </motion.div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-white">{title}</h3>
      <motion.div 
        className="text-4xl font-bold mt-2 text-gray-900 dark:text-white"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        {prefix}{value.toLocaleString()}{suffix}
      </motion.div>
    </motion.div>
  );
};

export default StatCard; 