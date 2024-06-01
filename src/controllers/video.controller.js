const VideoService = require('../services/video.service');
const { pipeline } = require('node:stream/promises');

class VideoController {
	getVideos(req, res) {
		const result = VideoService.getVideos(req);
		res.status(result.status).json(result.videos);
	}

	getVideoAsset = async (req, res, handleErr) => {
		try {
			const { fileStream, mimeType, filename, size } = await VideoService.getVideoAsset(req);

			if (req.query.type !== 'thumbnail') {
				res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
			}

			res.setHeader('Content-Type', mimeType);
			res.setHeader('Content-Length', size);
			res.status(200);

			await pipeline(fileStream, res);
		} catch (error) {
			if (error.message === 'Video not found!') {
				handleErr({
					status: 404,
					message: error.message,
				});
			} else {
				handleErr({
					status: 500,
					message: error.message,
				});
			}
		}
	};

	uploadVideo = async (req, res, handleErr) => {
		try {
			const result = await VideoService.uploadVideo(req);
			res.status(201).json(result);
		} catch (error) {
			if (error.message === 'Only these formats are allowed: mov, mp4') {
				handleErr({
					status: 400,
					message: error.message,
				});
			} else {
				if (error.code !== 'ECONNRESET') handleErr(error);
			}
		}
	};

	extractAudio = async (req, res, handleErr) => {
		try {
			const result = await VideoService.extractAudio(req);
			res.status(200).json(result);
		} catch (error) {
			if (error.message === 'The audio has already been extracted for this video.') {
				handleErr({
					status: 400,
					message: error.message,
				});
			} else {
				handleErr(error);
			}
		}
	};

    resizeVideo = async (req, res, handleErr) => {
        try {
          const result = await VideoService.resizeVideo(req);
          res.status(200).json(result);
        } catch (error) {
          handleErr(error);
        }
      };
}

module.exports = new VideoController();
