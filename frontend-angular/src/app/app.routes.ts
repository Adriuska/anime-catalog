import { Routes } from '@angular/router';
import { AnimeListComponent } from './pages/animes/anime-list.component';
import { AnimeDetailComponent } from './pages/animes/anime-detail.component';
import { AnimeFormComponent } from './pages/animes/anime-form.component';
import { StudioListComponent } from './pages/studios/studio-list.component';
import { StudioDetailComponent } from './pages/studios/studio-detail.component';
import { StudioFormComponent } from './pages/studios/studio-form.component';

export const routes: Routes = [
	{ path: '', pathMatch: 'full', redirectTo: 'animes' },
	{ path: 'animes', component: AnimeListComponent },
	{ path: 'animes/new', component: AnimeFormComponent },
	{ path: 'animes/:id', component: AnimeDetailComponent },
	{ path: 'animes/:id/edit', component: AnimeFormComponent },
	{ path: 'studios', component: StudioListComponent },
	{ path: 'studios/new', component: StudioFormComponent },
	{ path: 'studios/:id', component: StudioDetailComponent },
	{ path: 'studios/:id/edit', component: StudioFormComponent },
	{ path: '**', redirectTo: 'animes' },
];
