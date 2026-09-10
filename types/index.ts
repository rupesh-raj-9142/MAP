export type Category = 'history' | 'culture' | 'nature' | 'food' | 'spiritual' | 'shopping' | 'entertainment';

export type TripStatus = 'DRAFT' | 'PLANNED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
export type StopStatus = 'PENDING' | 'CURRENT' | 'COMPLETED' | 'SKIPPED' | 'REPLACED';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface UserPreferenceData {
  id?: string;
  userId: string;
  interests: string[];
  budgetPreference?: string | null;
  travelStyle?: string | null;
  transportPreference?: string | null;
  favoriteCategories: string[];
}

export interface AuthResponse {
  user: UserProfile;
  token: string;
}

export interface PlaceModel {
  id: string;
  externalId?: string | null;
  name: string;
  description: string;
  category: string;
  latitude: number;
  longitude: number;
  address: string;
  rating: number;
  reviewCount: number;
  phoneNumber?: string | null;
  website?: string | null;
  openingHours?: string | null;
  priceLevel?: string | null;
  entryFee: number;
  recommendedDuration: number;
  photos: string[];
  source: string;
  createdAt?: Date;
  updatedAt?: Date;
  // Extra fields for rich client presentation
  badge?: string;
  highlights?: string[];
  crowdToday?: string;
  crowdByHour?: number[];
  recommendedTransit?: string;
  localFoodTip?: string;
}

export interface RouteCoordinate {
  latitude: number;
  longitude: number;
}

export interface RouteLeg {
  origin: RouteCoordinate;
  destination: RouteCoordinate;
  distanceMeters: number;
  distanceKm: number;
  durationMinutes: number;
  mode: 'WALK' | 'DRIVE' | 'BICYCLE' | 'TRANSIT';
  modeLabel: string;
  costEstimate: number;
}

export interface RouteResult {
  origin: RouteCoordinate;
  destination: RouteCoordinate;
  totalDistanceMeters: number;
  totalDistanceKm: number;
  totalDurationMinutes: number;
  travelMode: string;
  legs: RouteLeg[];
  polyline?: string;
}

export interface TripStopModel {
  id: string;
  tripId: string;
  placeId: string;
  order: number;
  startTime?: string | null;
  durationMinutes: number;
  travelTimeMinutes: number;
  travelDistanceMeters: number;
  estimatedCost: number;
  notes?: string | null;
  status: StopStatus;
  place?: PlaceModel;
  transitNext?: string;
}

export interface ItineraryModel {
  id: string;
  tripId: string;
  totalDurationMinutes: number;
  totalDistanceMeters: number;
  totalDistanceKm: number;
  estimatedTotalCost: number;
  reasoningSummary?: string | null;
}

export interface TripModel {
  id: string;
  userId: string;
  title: string;
  locationName: string;
  latitude: number;
  longitude: number;
  durationMinutes: number;
  budget: number;
  travelMood?: string | null;
  travelGroup?: string | null;
  transportPreference?: string | null;
  status: TripStatus;
  stops: TripStopModel[];
  itinerary?: ItineraryModel | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  // Presentation fields for frontend compatibility
  duration?: string;
  stopsCount?: number;
  estimatedCost?: number;
  maxBudget?: number;
  distanceKm?: number;
  efficiencyScore?: string;
  image?: string;
}

export interface AIPlanRequest {
  location: {
    latitude?: number;
    longitude?: number;
    city?: string;
    address?: string;
  };
  availableTimeMinutes: number;
  budget: number;
  interests: string[];
  mood?: string;
  travelGroup?: string;
  transportPreference?: string;
}

export interface AIPlannedStopOutput {
  placeId: string;
  order: number;
  durationMinutes: number;
  reason: string;
}

export interface AIPlanOutput {
  title: string;
  stops: AIPlannedStopOutput[];
  reasoningSummary?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  formattedAddress: string;
  city: string;
  state?: string;
  country?: string;
}
