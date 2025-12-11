'use client';

import React from 'react';
import Link from 'next/link';

interface AuthorLinkProps {
  username: string;
  avatar?: string;
  isAnonymous?: boolean;
  showAvatar?: boolean;
  avatarSize?: 'sm' | 'md' | 'lg';
  className?: string;
  children?: React.ReactNode;
}

/**
 * Reusable component for author name/avatar that links to profile
 * If anonymous, shows "Anonymous Inventor" without link
 */
export const AuthorLink: React.FC<AuthorLinkProps> = ({
  username,
  avatar,
  isAnonymous = false,
  showAvatar = true,
  avatarSize = 'sm',
  className = '',
  children,
}) => {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  const defaultAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;

  if (isAnonymous) {
    return (
      <span className={`text-gray-400 ${className}`}>
        {children || 'Anonymous Inventor'}
      </span>
    );
  }

  return (
    <Link
      href={`/profile/${encodeURIComponent(username)}`}
      className={`flex items-center gap-2 hover:text-purple-400 transition-colors group ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      {showAvatar && (
        <div className={`${sizeClasses[avatarSize]} rounded-full overflow-hidden border border-white/10 group-hover:border-purple-400/50 transition-colors`}>
          <img
            src={avatar || defaultAvatar}
            alt={username}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <span className="group-hover:underline">
        {children || username}
      </span>
    </Link>
  );
};

/**
 * Avatar-only link to profile
 */
export const AuthorAvatar: React.FC<{
  username: string;
  avatar?: string;
  isAnonymous?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}> = ({ username, avatar, isAnonymous = false, size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
    xl: 'w-12 h-12',
  };

  const defaultAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;

  if (isAnonymous) {
    return (
      <div className={`flex-shrink-0 ${sizeClasses[size]} rounded-full overflow-hidden bg-gray-700 flex items-center justify-center ${className}`}>
        <span className="text-xs text-gray-400">?</span>
      </div>
    );
  }

  return (
    <Link
      href={`/profile/${encodeURIComponent(username)}`}
      className={`block flex-shrink-0 ${sizeClasses[size]} rounded-full overflow-hidden border border-white/10 hover:border-purple-400/50 transition-colors ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      <img
        src={avatar || defaultAvatar}
        alt={username}
        className="w-full h-full object-cover rounded-full"
      />
    </Link>
  );
};
