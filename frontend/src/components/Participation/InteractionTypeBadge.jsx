import React from 'react';
import {
  ChatBubbleLeftIcon,
  FaceSmileIcon,
  MicrophoneIcon,
  VideoCameraIcon,
  PencilSquareIcon,
  ArrowRightOnRectangleIcon,
  ArrowLeftOnRectangleIcon
} from '@heroicons/react/24/outline';

const InteractionTypeBadge = ({ type, size = 'md' }) => {
  const getConfig = () => {
    switch (type) {
      case 'join':
        return {
          label: 'Joined',
          icon: ArrowRightOnRectangleIcon,
          bgColor: 'bg-emerald-100',
          textColor: 'text-emerald-800',
          borderColor: 'border-emerald-200'
        };
      case 'leave':
        return {
          label: 'Left',
          icon: ArrowLeftOnRectangleIcon,
          bgColor: 'bg-orange-100',
          textColor: 'text-orange-800',
          borderColor: 'border-orange-200'
        };
      case 'chat':
        return {
          label: 'Chat',
          icon: ChatBubbleLeftIcon,
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-800',
          borderColor: 'border-blue-200'
        };
      case 'reaction':
        return {
          label: 'Reaction',
          icon: FaceSmileIcon,
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-800',
          borderColor: 'border-yellow-200'
        };
      case 'mic_toggle':
        return {
          label: 'Mic Toggle',
          icon: MicrophoneIcon,
          bgColor: 'bg-green-100',
          textColor: 'text-green-800',
          borderColor: 'border-green-200'
        };
      case 'camera_toggle':
        return {
          label: 'Camera Toggle',
          icon: VideoCameraIcon,
          bgColor: 'bg-purple-100',
          textColor: 'text-purple-800',
          borderColor: 'border-purple-200'
        };
      case 'manual_entry':
        return {
          label: 'Manual Entry',
          icon: PencilSquareIcon,
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          borderColor: 'border-gray-200'
        };
      default:
        return {
          label: type || 'Unknown',
          icon: null,
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          borderColor: 'border-gray-200'
        };
    }
  };

  const config = getConfig();
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium border ${config.bgColor} ${config.textColor} ${config.borderColor} ${sizeClasses[size]}`}
    >
      {Icon && <Icon className={iconSizes[size]} />}
      {config.label}
    </span>
  );
};

export default InteractionTypeBadge;
