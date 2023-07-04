import axios from 'axios';
import { Router } from 'express';
const trackPreferencesRouter = Router();

import { getAlbumTracks } from '../utils/spotifyUtils.js';

import { album_preference } from '../models/index.js';
import {
  getSpotifyUser,
  findUser,
  findOrCreateUser,
  getAlbumPreference
} from '../utils/dbMiddleware.js';

// Fetch Spotify id with token for database authentication
trackPreferencesRouter.use(getSpotifyUser);

const albumIdExtractor = (req, res, next) => {
  const uri = req.body.uri || req.query.uri;
  if (!uri) {
    return res.status(400).send('No Spotify URI given');
  }
  else if (!uri.startsWith('spotify:album:')) {
    return res.status(400).send('Spotify URI must be for an album');
  }

  req.albumId = uri.split(':').at(-1);
  if (req.albumId === '') {
    return res.status(400).send('No album id specified');
  }

  next();
};

// Get Spotify track list and corresponding preferences from db if they exist
trackPreferencesRouter.get('/', [albumIdExtractor, findUser], async (req, res, next) => {
  try {
    // Execute both async functions in parallel
    const trackPromise = await Promise
      .all([
        getAlbumTracks(req.albumId, req.token),
        getAlbumPreference(req.albumId, req.user.id)
      ]);

    const [spotifyTracks, preference] = trackPromise;
    if (
      Object.hasOwn(preference, 'dataValues')
      && Object.hasOwn(preference.dataValues, 'track_preferences')
    ) {
      const trackPreferences = spotifyTracks.map((track, index) => {
        return ({
          name: track.name,
          uri: track.uri,
          play: preference.dataValues.track_preferences[index] === '1' ? true : false
        });
      });

      res.status(200).json(trackPreferences);
    }
    else {
      const trackPreferences = spotifyTracks.map((track) => {
        return ({
          name: track.name,
          uri: track.uri,
          play: true
        });
      });
      res.status(200).json(trackPreferences);
    }
  }
  catch(error) {
    next(error);
  }
});

// Post/update track preferences for the corresponding Spotify album
trackPreferencesRouter.post('/', [albumIdExtractor, findOrCreateUser], async (req, res, next) => {
  try {
    // Create or update album preference
    const [newPreference] = await album_preference.upsert({
      album_id: req.albumId,
      user_id: req.user.id,
      num_tracks: req.body.numTracks,
      track_preferences: req.body.preferences
    });
    res.status(200).json(newPreference);
  }
  catch(error) {
    next(error);
  }
});

export default trackPreferencesRouter;
