import { Studio } from './studio.model';

export interface Anime {
  _id?: string;
  title: string;
  description: string;
  posterUrl: string;
  bannerUrl?: string;
  episodes: number;
  releaseDate: string;
  isOngoing: boolean;
  rating: number;
  inLibrary?: boolean;
  isFavorite?: boolean;
  genres: string[];
  studio?: string | Studio;
  createdAt?: string;
  updatedAt?: string;
}

export interface AnimeListResponse {
  data: Anime[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
