import "dotenv/config";
import ObjectsToCsv from "objects-to-csv";

const params = new URLSearchParams();
params.append("grant_type", "client_credentials");

const response = await fetch("https://accounts.spotify.com/api/token", {
  method: "post",
  body: params,
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
    Authorization:
      "Basic " +
      new Buffer.from(
        process.env.CLIENT_ID + ":" + process.env.CLIENT_SECRET
      ).toString("base64"),
  },
});

const data = await response.json();
const accessToken = data.access_token;

const tracks = [];

let trackURL = `https://api.spotify.com/v1/playlists/${process.env.PLAYLIST_ID}/tracks?offset=0&limit=100&locale=*`;
while (trackURL) {
  // Fetch the next batch of tracks
  const playlistRes = await fetch(trackURL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const json = await playlistRes.json();

  for (const spotifyTrack of json.items) {
    const joinedArtists = spotifyTrack.track.artists
      .map((artist) => artist.name)
      .join("|");
    const primaryArtist = spotifyTrack.track.artists?.[0]?.name;

    const releaseDate = spotifyTrack.track.album.release_date;
    const releaseYear = new Date(String(releaseDate)).getUTCFullYear();

    const track = {
      logged_at: spotifyTrack.added_at,
      track_id: spotifyTrack.track.id,
      title: spotifyTrack.track.name,
      artists: joinedArtists,
      primary_artist: primaryArtist,
      album: spotifyTrack.track.album.name,
      duration_ms: spotifyTrack.track.duration_ms,
      release_year: releaseYear,
      release_date: releaseDate,
      release_date_precision: spotifyTrack.track.album.release_date_precision,
      album_art_large: spotifyTrack.track.album?.images?.[0]?.url,
      album_art_small: spotifyTrack.track.album?.images?.at?.(-1)?.url,
      track_url: spotifyTrack.track.external_urls.spotify,
    };

    tracks.push(track);
  }

  trackURL = json.next;
}

const csv = new ObjectsToCsv(tracks);
await csv.toDisk("./tracks.csv");
