import React from 'react';
import { Feather } from '@expo/vector-icons';

// Set default icon props
const defaultProps = {
	size: 20,
	color: '#666',
};

export const ListIcon = (props) => (
	<Feather name="list" {...defaultProps} {...props} />
);

export const StarIcon = (props) => (
	<Feather name="star" {...defaultProps} {...props} />
);

export const StarFilledIcon = (props) => (
	<Feather name="star" {...defaultProps} {...props} style={{ color: '#FFD700' }} />
);

export const BusIcon = (props) => (
	<Feather name="truck" {...defaultProps} {...props} />
);

export const MapIcon = (props) => (
	<Feather name="map" {...defaultProps} {...props} />
);

export const HeartIcon = (props) => (
	<Feather name="heart" {...defaultProps} {...props} />
);

export const HeartFilledIcon = (props) => (
	<Feather name="heart" {...defaultProps} {...props} style={{ color: '#FF6B6B' }} />
);

// Alternative icons you can use:
export const NavigationIcon = (props) => (
	<Feather name="navigation" {...defaultProps} {...props} />
);

export const ClockIcon = (props) => (
	<Feather name="clock" {...defaultProps} {...props} />
);

export const LocationIcon = (props) => (
	<Feather name="map-pin" {...defaultProps} {...props} />
);

export const ArrowLeftIcon = (props) => (
	<Feather name="arrow-left" {...defaultProps} {...props} />
);

export const RefreshIcon = (props) => (
	<Feather name="refresh-ccw" {...defaultProps} {...props} />
);


export default {
	ListIcon,
	StarIcon,
	StarFilledIcon,
	BusIcon,
	MapIcon,
	HeartIcon,
	HeartFilledIcon,
	NavigationIcon,
	ClockIcon,
	LocationIcon,
	ArrowLeftIcon,
};
