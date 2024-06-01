const express = require('express');
const router = express.Router();
const videoController = require('../../controllers/video.controller');

router.get('/api/videos', videoController.getVideos);
// Upload a video file
router.post('/api/upload-video', videoController.uploadVideo);
// Extract the audio for a video file (can only be done once per video)
router.patch('/api/video/extract-audio', videoController.extractAudio);
// Resize a video file (creates a new video file)
router.put('/api/video/resize', videoController.resizeVideo);
// Return a video asset to the client
router.get('/get-video-asset', videoController.getVideoAsset);

module.exports = router;
