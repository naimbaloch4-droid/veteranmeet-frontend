// Formatting functions for veteran dashboard

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateString);
}

export function formatStarCount(stars: number): string {
  if (stars >= 1000000) return `${(stars / 1000000).toFixed(1)}M`;
  if (stars >= 1000) return `${(stars / 1000).toFixed(1)}K`;
  return stars.toString();
}

export function getVeteranCategoryFromStars(stars: number): string {
  if (stars >= 100000) return 'Eternal Sage';
  if (stars >= 70000) return 'Platinum Veteran';
  if (stars >= 65000) return 'Sapphire Veteran';
  if (stars >= 60000) return 'Diamond Veteran';
  if (stars >= 50000) return 'Golden Veteran';
  if (stars >= 40000) return 'Ruby Veteran';
  if (stars >= 25000) return 'Silver Veteran';
  return 'Bronze Veteran';
}

export function getInitials(firstName?: string, lastName?: string, username?: string): string {
  if (firstName && lastName) {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  }
  if (username) {
    return username.slice(0, 2).toUpperCase();
  }
  return 'VT';
}

export function getVeteranCategoryColor(category?: string): string {
  const colors: { [key: string]: string } = {
    'Eternal Sage': 'text-purple-600',
    'Platinum Veteran': 'text-gray-600',
    'Sapphire Veteran': 'text-blue-600',
    'Diamond Veteran': 'text-cyan-600',
    'Golden Veteran': 'text-yellow-600',
    'Ruby Veteran': 'text-red-600',
    'Silver Veteran': 'text-gray-500',
    'Bronze Veteran': 'text-orange-600'
  };
  return colors[category || ''] || 'text-gray-600';
}

export function getAnnouncementPriorityColor(priority: string): string {
  const colors: { [key: string]: string } = {
    'urgent': 'bg-red-50 border-red-200 text-red-800',
    'high': 'bg-orange-50 border-orange-200 text-orange-800',
    'medium': 'bg-yellow-50 border-yellow-200 text-yellow-800',
    'low': 'bg-blue-50 border-blue-200 text-blue-800'
  };
  return colors[priority] || colors['low'];
}
