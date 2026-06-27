// ============================================
// 7. components/Common/Card.tsx
// ============================================
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hover = false,
  padding = 'md',
  shadow = 'sm',
}) => {
  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-6',
    lg: 'p-8',
  };

  const shadows = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl',
  };

  const classes = `
    bg-white dark:bg-gray-800 rounded-xl
    ${paddings[padding]}
    ${shadows[shadow]}
    ${hover ? 'transition-all duration-200 hover:shadow-lg hover:-translate-y-1' : ''}
    ${className}
  `;

  return <div className={classes}>{children}</div>;
};

export default Card;