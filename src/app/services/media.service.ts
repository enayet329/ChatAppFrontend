import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Media } from '../models/media.model';

@Injectable({ providedIn: 'root' })
export class MediaService {
  private apiUrl = `${environment.apiUrl}/media`;

  constructor(private http: HttpClient) {}

  uploadMedia(file: File): Observable<Media> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    return this.http.post<Media>(`${this.apiUrl}/upload`, formData);
  }

  getMedia(mediaId: string): Observable<Media> {
    return this.http.get<Media>(`${this.apiUrl}/${mediaId}`);
  }
}