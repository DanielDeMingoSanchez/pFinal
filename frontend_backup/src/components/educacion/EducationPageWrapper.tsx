import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Typography, Paper, Box, Chip, Divider } from '@mui/material';

interface EducationPageWrapperProps {
  title: string;
  description: string;
  children: ReactNode;
  icon: ReactNode;
  color?: string;
}

const EducationPageWrapper: React.FC<EducationPageWrapperProps> = ({
  title,
  description,
  children,
  icon,
  color = '#4F46E5'
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto px-4 py-6"
    >
      <Paper 
        elevation={0}
        sx={{ 
          p: 3, 
          mb: 4, 
          borderRadius: 2,
          background: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
        }}
      >
        <Box display="flex" alignItems="center" mb={2}>
          <Box mr={2} sx={{ color }}>
            {icon}
          </Box>
          <Typography variant="h4" component="h1" fontWeight="bold">
            {title}
          </Typography>
        </Box>
        <Divider sx={{ my: 2 }} />
        <Typography variant="body1" color="text.secondary" paragraph>
          {description}
        </Typography>
        <Box display="flex" flexWrap="wrap" gap={1} mt={2}>
          <Chip 
            label="Documentos compartidos" 
            size="small" 
            sx={{ bgcolor: `${color}20`, color: color }} 
          />
          <Chip 
            label="Comunidad educativa" 
            size="small" 
            sx={{ bgcolor: 'rgba(79, 70, 229, 0.1)', color: '#4F46E5' }} 
          />
          <Chip 
            label="Recursos de calidad" 
            size="small" 
            sx={{ bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }} 
          />
        </Box>
      </Paper>
      
      {children}
    </motion.div>
  );
};

export default EducationPageWrapper; 